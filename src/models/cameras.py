from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base
import uuid
from sqlalchemy import String, Text, DateTime, Boolean, Float, ForeignKey, CheckConstraint, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from geoalchemy2 import Geography

#--------------------------------------------------------------------------------CameraCategories-------------------------------------------------------------------------------------

class CameraCategories (Base):
    __tablename__ = "camera_categories"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str | None] = mapped_column(String(128), nullable=True)
    color: Mapped[str | None] = mapped_column(String(32), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc)
    )
#--------------------------------------------------------------------------------Camera-------------------------------------------------------------------------------------
class Camera(Base):
    __tablename__ = "cameras"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    location: Mapped[object] = mapped_column(
        Geography(geometry_type="POINT", srid=4326),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="unknown"
    )

    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("camera_categories.id"),
        nullable=True
    )

    is_public: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    preview_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    azimuth: Mapped[float | None] = mapped_column(Float, nullable=True)
    view_angle: Mapped[float | None] = mapped_column(Float, nullable=True)
    view_distance_meters: Mapped[float | None] = mapped_column(Float, nullable=True)

    has_audio: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_ptz: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_night_vision: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    __table_args__ = (
        CheckConstraint("latitude >= -90 AND latitude <= 90", name="chk_cameras_latitude"),
        CheckConstraint("longitude >= -180 AND longitude <= 180", name="chk_cameras_longitude"),
        CheckConstraint("azimuth IS NULL OR (azimuth >= 0 AND azimuth <= 360)", name="chk_cameras_azimuth"),
        CheckConstraint("view_angle IS NULL OR (view_angle > 0 AND view_angle <= 360)", name="chk_cameras_view_angle"),
        CheckConstraint("view_distance_meters IS NULL OR view_distance_meters > 0", name="chk_cameras_view_distance"),
    )
    
#---------------------------------------------------------------------------CameraStatusHistory-------------------------------------------------------------------------------------
class CameraStatusHistory(Base):
        
    __tablename__ = "camera_status_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    camera_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cameras.id"),
        nullable=False
    )

    old_status: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True
    )

    new_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    
    
#----------------------------------------------------------------------------CameraStreamConfig------------------------------------------------------------------------------------
class CameraStreamConfig(Base):
    __tablename__ = "camera_stream_configs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    camera_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cameras.id"),
        nullable=False,
        unique=True  
    )

    protocol: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="rtsp"
    )

    host: Mapped[str] = mapped_column(String(255), nullable=False)
    port: Mapped[int] = mapped_column(Integer, nullable=False, default=554)
    path: Mapped[str | None] = mapped_column(Text, nullable=True)

    rtsp_transport: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        default="tcp"
    )

    main_stream_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    sub_stream_path: Mapped[str | None] = mapped_column(Text, nullable=True)

    onvif_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )

    onvif_host: Mapped[str | None] = mapped_column(String(255), nullable=True)
    onvif_port: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        CheckConstraint(
            "port > 0 AND port <= 65535",
            name="chk_camera_stream_configs_port"
        ),
        CheckConstraint(
            "onvif_port IS NULL OR (onvif_port > 0 AND onvif_port <= 65535)",
            name="chk_camera_stream_configs_onvif_port"
        ),
    )

#----------------------------------------------------------------------------------CameraCredentials--------------------------------------------------------------------------------------
class CameraCredentials(Base):
    __tablename__ = "camera_credentials"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    camera_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cameras.id"),
        nullable=False,
        unique=True
    )

    username_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    password_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)

    onvif_username_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    onvif_password_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)

    encryption_key_id: Mapped[str | None] = mapped_column(String(128), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    rotated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    __table_args__ = (
        UniqueConstraint("camera_id", name="uq_camera_credentials_camera_id"),
    )