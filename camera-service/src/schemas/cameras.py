from pydantic import BaseModel
import uuid
from datetime import datetime
from pydantic import ConfigDict
#--------------------------------------------------------CameraCategories------------------------------------------------------------
class CameraCategoryBaseSchema(BaseModel):
    code: str
    title: str
    description: str | None = None
    icon: str | None = None
    color: str | None = None
    
class CameraCategoryCreateSchema(CameraCategoryBaseSchema):
    pass


class CameraCategoryUpdateSchema(BaseModel):
    code: str | None = None
    title: str | None = None
    description: str | None = None
    icon: str | None = None
    color: str | None = None


class CameraCategoryResponseSchema(CameraCategoryBaseSchema):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)


#--------------------------------------------------------------------------------Camera-------------------------------------------------------------------------------------
class CameraBaseSchema(BaseModel):
    title: str
    description: str | None = None

    latitude: float
    longitude: float

    status: str = "unknown"
    
    category: CameraCategoryResponseSchema | None = None
    
    #category_id: uuid.UUID | None = None

    is_public: bool = True
    is_active: bool = True

    preview_url: str | None = None

    azimuth: float | None = None
    view_angle: float | None = None
    view_distance_meters: float | None = None

    has_audio: bool = False
    has_ptz: bool = False
    has_night_vision: bool = False
    
    model_config = ConfigDict(from_attributes=True)


class CameraCreateSchema(CameraBaseSchema):
    pass


class CameraUpdateSchema(BaseModel):
    title: str | None = None 
    description: str | None = None

    latitude: float | None = None
    longitude: float | None = None

    status: str | None = None 
    category_id: uuid.UUID | None = None

    is_public: bool | None = None
    is_active: bool | None = None

    preview_url: str | None = None

    azimuth: float | None = None 
    view_angle: float | None = None 
    view_distance_meters: float | None = None 

    has_audio: bool | None = None
    has_ptz: bool | None = None
    has_night_vision: bool | None = None


class CameraResponseSchema(CameraBaseSchema):
    id: uuid.UUID

    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
#---------------------------------------------------------------------------CameraStatusHistory-----------------------------------------------------------------------------------

class CameraStatusHistoryBaseSchema(BaseModel):
    camera_id: uuid.UUID

    old_status: str | None = None
    new_status: str

    reason: str | None = None


class CameraStatusHistoryCreate(CameraStatusHistoryBaseSchema):
    pass


class CameraStatusHistoryUpdate(BaseModel):
    old_status: str | None = None
    new_status: str | None = None

    reason: str | None = None


class CameraStatusHistoryResponse(CameraStatusHistoryBaseSchema):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
#----------------------------------------------------------------------------------CameraCredentials--------------------------------------------------------------------------------------
class CameraCredentialsBaseSchema(BaseModel):
    camera_id: uuid.UUID

    username_encrypted: str | None = None
    password_encrypted: str | None = None

    onvif_username_encrypted: str | None = None
    onvif_password_encrypted: str | None = None

    encryption_key_id: str | None = None


class CameraCredentialsCreateSchema(CameraCredentialsBaseSchema):
    pass


class CameraCredentialsUpdateSchema(BaseModel):
    username_encrypted: str | None = None
    password_encrypted: str | None = None

    onvif_username_encrypted: str | None = None
    onvif_password_encrypted: str | None = None

    encryption_key_id: str | None = None

    rotated_at: datetime | None = None


class CameraCredentialsResponseSchema(BaseModel):
    username_encrypted: str | None = None
    password_encrypted: str | None = None

    onvif_username_encrypted: str | None = None
    onvif_password_encrypted: str | None = None
    model_config = ConfigDict(from_attributes=True)
    
    
#----------------------------------------------------------------------------CameraStreamConfig-----------------------------------------------------------------------------------
class CameraStreamConfigBaseSchema(BaseModel):
    camera_id: uuid.UUID
    
    
    protocol: str = "rtsp"

    host: str
    port: int = 554
    path: str | None = None

    rtsp_transport: str | None = "tcp"

    main_stream_path: str | None = None
    sub_stream_path: str | None = None

    onvif_enabled: bool = False

    onvif_host: str | None = None
    onvif_port: int | None = None
    
    credentials: CameraCredentialsResponseSchema | None
    


class CameraStreamConfigCreateSchema(CameraStreamConfigBaseSchema):
    pass


class CameraStreamConfigUpdateSchema(BaseModel):
    protocol: str | None = None

    host: str | None = None
    port: int | None = None
    path: str | None = None

    rtsp_transport: str | None = None

    main_stream_path: str | None = None
    sub_stream_path: str | None = None

    onvif_enabled: bool | None = None

    onvif_host: str | None = None
    onvif_port: int | None = None


class CameraStreamConfigResponseSchema(CameraStreamConfigBaseSchema):
    
    model_config = ConfigDict(from_attributes=True)
    

class CameraListResponseSchema(BaseModel):
    items: list[CameraBaseSchema]
    total: int


class CameraCategoriesResponseSchema(BaseModel):
    items: list[CameraCategoryResponseSchema]