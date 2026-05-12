from pydantic import BaseModel

class CameraSchema(BaseModel):
    x: int
    y: int
    
class CameraResponseScheme(CameraSchema):
    id: int