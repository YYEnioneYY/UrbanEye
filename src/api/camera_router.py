from fastapi import APIRouter
# from src.api.dependencies import SessionDep
# from src.database import engine
# from src.schemas.cameras import CameraSchema
# from src.models.cameras import CameraModel
# from fastapi import HTTPException
# from src.schemas.cameras import CameraResponseScheme
# from src.database import Base

camera_router = APIRouter()

   
@camera_router.post("/set_up_db")   
async def setup_db():
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.drop_all)
    #     await conn.run_sync(Base.metadata.create_all)
    return {"status": "ok"}

# @camera_router.post("/camera")
# async def add(data: CameraSchema, session: SessionDep):
#     new_camera = CameraModel(
#         x = data.x,
#         y = data.y,
#     )
#     session.add(new_camera)
#     await session.commit()
#     return {"status": "added"}

# @camera_router.delete("/camera/{camera_id}")
# async def delete_camera(camera_id: int, session: SessionDep):
#     camera = await session.get(CameraModel, camera_id)

#     if not camera:
#         raise HTTPException(status_code=404, detail="Camera not found")

#     await session.delete(camera)
#     await session.commit()

#     return {"status": "deleted"}

# #@camera_router.get("/camera", response_model=list[CameraResponseScheme])
# #async def get_cameras(session: SessionDep):
# #    result = await session.execute(select(CameraModel))
# #    cameras = result.scalars().all()

# #    return cameras

# @camera_router.get("/camera/{camera_id}", response_model=CameraResponseScheme)
# async def get_camera(camera_id: int, session: SessionDep):
#     camera = await session.get(CameraModel, camera_id)

#     if not camera:
#         raise HTTPException(status_code=404, detail="Camera not found")

#     return camera

# @camera_router.put("/camera/{camera_id}", response_model=CameraResponseScheme)
# async def update_camera(
#     camera_id: int,
#     data: CameraSchema,
#     session: SessionDep
# ):
#     camera = await session.get(CameraModel, camera_id)

#     if not camera:
#         raise HTTPException(status_code=404, detail="Camera not found")

#     camera.x = data.x
#     camera.y = data.y

#     await session.commit()
#     await session.refresh(camera)

#     return camera