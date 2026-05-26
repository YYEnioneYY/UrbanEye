from fastapi import APIRouter
from src.api.dependencies import SessionDep
from src.models.cameras import CameraModel, CameraCategoriesModel, CameraStreamConfigModel
from fastapi import HTTPException
from src.schemas.cameras import CameraCredentialsResponseSchema, CameraStreamConfigResponseSchema, CameraListResponseSchema, CameraResponseSchema, CameraCreateSchema, CameraCategoriesResponseSchema, CameraCategoryCreateSchema, CameraCategoryResponseSchema, CameraUpdateSchema
from fastapi import Query
from sqlalchemy import func, select, update
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import datetime, timezone
import math
from geoalchemy2 import WKTElement


EARTH_RADIUS_METERS = 6371000

camera_router = APIRouter()

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Расстояние между двумя точками в метрах
    """

    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)

    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_rad)
        * math.cos(lat2_rad)
        * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return EARTH_RADIUS_METERS * c


def calculate_bearing(lat1, lon1, lat2, lon2):
    """
    Направление от камеры к точке
    """

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)

    dlon_rad = math.radians(lon2 - lon1)

    x = math.sin(dlon_rad) * math.cos(lat2_rad)

    y = (
        math.cos(lat1_rad) * math.sin(lat2_rad)
        - math.sin(lat1_rad)
        * math.cos(lat2_rad)
        * math.cos(dlon_rad)
    )

    bearing = math.degrees(math.atan2(x, y))

    return (bearing + 360) % 360


def angle_difference(angle1, angle2):
    """
    Минимальная разница между углами
    """

    diff = abs(angle1 - angle2) % 360

    if diff > 180:
        diff = 360 - diff

    return diff


def calculate_match_score(
    distance_to_point_meters,
    centerline_offset_meters,
    angle_diff,
    camera_view_distance
):
    """
    Примерный score релевантности
    """

    distance_score = max(
        0,
        1 - (distance_to_point_meters / camera_view_distance)
    )

    offset_score = max(
        0,
        1 - (centerline_offset_meters / 100)
    )

    angle_score = max(
        0,
        1 - (angle_diff / 180)
    )

    score = (
        distance_score * 0.5
        + offset_score * 0.3
        + angle_score * 0.2
    )

    return round(score, 2)

@camera_router.get("/cameras", response_model=CameraListResponseSchema)
async def get_camera(session: SessionDep, bbox: str = Query(...)):
    
    bbox_list = bbox.split(",")
    
    if len(bbox_list) != 4:
        raise HTTPException(status_code=400, detail="incorrect query")
    
    min_lng,min_lat,max_lng,max_lat = map(float, bbox_list)
    
    envelope = func.ST_MakeEnvelope(min_lng,min_lat,max_lng,max_lat, 4326)
    
    stmt = (select(CameraModel).options(selectinload(CameraModel.category)).where(func.ST_Intersects(CameraModel.location,envelope)))
    
    result = await session.scalars(stmt)
    
    cameras = result.all()

    return {
        "items" : cameras,
        "total" : len(cameras)
    }
    
    
@camera_router.get("/admin/cameras/{camera_id}", response_model=CameraResponseSchema)
async def get_cameras_by_id(camera_id: UUID, session: SessionDep):
    
    stmt = (select(CameraModel).options(selectinload(CameraModel.category)).where(CameraModel.id == camera_id))
    result = await session.execute(stmt)
    
    camera = result.scalars().first()
    
    if camera is None:
        raise HTTPException(status_code=404, detail="camera is not founded")
    
    return camera
    
@camera_router.get("/cameras/looking-at", response_model=CameraListResponseSchema)
async def get_cameras_looking_at(session: SessionDep, lat: float = Query(...), lng: float = Query(...), camera_search_radius_meters: int = Query(1000), target_radius_meters: int = Query(100), status: str = Query("active"), category: UUID | None = Query(None), limit: int = Query(20)):
    
    stmt = (
        select(CameraModel)
        .options(selectinload(CameraModel.category))
        .where(CameraModel.deleted_at.is_(None))
        .where(CameraModel.is_active.is_(True))
        .where(CameraModel.azimuth.is_not(None))
        .where(CameraModel.view_angle.is_not(None))
        .where(CameraModel.view_distance_meters.is_not(None))
    )
    
    
    if status == "online":
        stmt = stmt.where(CameraModel.status == status)

    if category is not None:
        stmt = stmt.where(CameraModel.category_id == category)

    result = await session.execute(stmt)

    cameras = result.scalars().all()
    
    matched_cameras = []

    for camera in cameras:

        distance_to_point_meters = haversine_distance(
            camera.latitude,
            camera.longitude,
            lat,
            lng
        )

        if distance_to_point_meters > camera_search_radius_meters:
            continue

        if distance_to_point_meters > camera.view_distance_meters:
            continue

        bearing_to_point = calculate_bearing(
            camera.latitude,
            camera.longitude,
            lat,
            lng
        )

        angle_diff = angle_difference(
            camera.azimuth,
            bearing_to_point
        )

        if angle_diff > (camera.view_angle / 2):
            continue

        centerline_offset_meters = (
            distance_to_point_meters
            * math.sin(math.radians(angle_diff))
        )

        if centerline_offset_meters > target_radius_meters:
            continue
            
        match_score = calculate_match_score(
            distance_to_point_meters=distance_to_point_meters,
            centerline_offset_meters=centerline_offset_meters,
            angle_diff=angle_diff,
            camera_view_distance=camera.view_distance_meters
        )
        
        matched_cameras.append({
            "id": camera.id,
            "title": camera.title,
            "latitude": camera.latitude,
            "longitude": camera.longitude,
            "status": camera.status,
            "preview_url": camera.preview_url,
            "azimuth": camera.azimuth,
            "view_angle": camera.view_angle,
            "view_distance_meters": camera.view_distance_meters,
            "distance_to_point_meters": round(distance_to_point_meters, 2),
            "centerline_offset_meters": round(centerline_offset_meters, 2),
            "target_radius_meters": target_radius_meters,
            "match_score": match_score
        })

    return {
        "items": matched_cameras,
        "total": len(matched_cameras)
    }

#--------------доделать------------------
@camera_router.post("/admin/cameras", response_model=CameraCreateSchema)
async def add_camera(camera: CameraCreateSchema, session: SessionDep):
    
    location = WKTElement(
        f"POINT({camera.longitude} {camera.latitude})",
        srid=4326
    )
    
    newCamera = CameraModel(
        title=camera.title,
        description=camera.description,
        latitude=camera.latitude,
        longitude=camera.longitude,
        location=location,
        status=camera.status,
        category_id=camera.category_id,
        is_public=camera.is_public,
        is_active=camera.is_active,
        preview_url=camera.preview_url,
        azimuth=camera.azimuth,
        view_angle=camera.view_angle,
        view_distance_meters=camera.view_distance_meters,
        has_audio=camera.has_audio,
        has_ptz=camera.has_ptz,
        has_night_vision=camera.has_night_vision
    )
    session.add(newCamera)
    await session.commit()
    await session.refresh(newCamera)
    
    return {
        newCamera
    }

@camera_router.patch("/admin/cameras/{camera_id}")
async def update_canera(camera_id: UUID, data : CameraUpdateSchema, session: SessionDep):
    update_data = data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    stmt = (update(CameraModel).where(CameraModel.id == camera_id).values(**update_data).returning(CameraModel))

    result = await session.execute(stmt)
    camera = result.scalar_one_or_none()

    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    await session.commit()
    return camera

    

@camera_router.delete("/admin/cameras/{camera_id}")
async def delete_camera(camera_id: UUID,data: CameraUpdateSchema,session: SessionDep):
    camera = await session.get(CameraModel, camera_id)
    camera.deleted_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(camera)
    return {
        "status" : "deleted"
    }
    
    
@camera_router.get("/camera-categories", response_model=CameraCategoriesResponseSchema)
async def get_categories(session: SessionDep):
    
    result = await session.execute(select(CameraCategoriesModel))
    
    categories = result.scalars().all()
    
    return {
            "items" : categories
            }
    

@camera_router.post("/admin/camera-categories", response_model=CameraCategoryResponseSchema)
async def add_camera_category(data : CameraCategoryCreateSchema, session : SessionDep):
    newCameraCategory = CameraCategoriesModel(
        code = data.code,
        title = data.title,
        description = data.description,
        icon = data.icon,
        color = data.color
    )
    session.add(newCameraCategory)
    await session.commit()
    return newCameraCategory

@camera_router.post("/internal/cameras/{camera_id}/stream-config", response_model= CameraStreamConfigResponseSchema)
async def add_camera_category(camera_id: UUID, session : SessionDep):
    
    stmt = (select(CameraModel).options(selectinload(CameraModel.stream_config),selectinload(CameraModel.credentials),).where(CameraModel.id == camera_id))
    result = await session.execute(stmt)
    camera = result.scalar_one_or_none()
    stream = camera.stream_config
    creds = camera.credentials

    return CameraStreamConfigResponseSchema(
        camera_id=stream.camera_id,
        protocol=stream.protocol,
        host=stream.host,
        port=stream.port,
        path=stream.path,
        rtsp_transport=stream.rtsp_transport,
        main_stream_path=stream.main_stream_path,
        sub_stream_path=stream.sub_stream_path,
        onvif_enabled=stream.onvif_enabled,
        onvif_host=stream.onvif_host,
        onvif_port=stream.onvif_port,

        credentials=(
            CameraCredentialsResponseSchema(
                username=creds.username_encrypted,
                password=creds.password_encrypted,
                onvif_username=creds.onvif_username_encrypted,
                onvif_password=creds.onvif_password_encrypted,
            )
        )
    )
    
@camera_router.get("/health")
async def Get_health_sstatus():
    
    return{
            "status": "ok",
            "service": "camera-service"
            }
