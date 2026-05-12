from fastapi import FastAPI
from src.api.camera_router import camera_router

app = FastAPI()
app.include_router(camera_router, prefix="/api")



