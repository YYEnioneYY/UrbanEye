CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "camera_status" AS ENUM ('online', 'offline', 'maintenance', 'planned');

-- CreateTable
CREATE TABLE "cameras" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "camera_status" NOT NULL DEFAULT 'planned',
    "city" TEXT,
    "address" TEXT,
    "category" TEXT,
    "location" geometry(Point, 4326) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cameras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "camera_connections" (
    "id" UUID NOT NULL,
    "camera_id" UUID NOT NULL,
    "encrypted_rtsp_url" TEXT NOT NULL,
    "encrypted_username" TEXT,
    "encrypted_password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "camera_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cameras_slug_key" ON "cameras"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "camera_connections_camera_id_key" ON "camera_connections"("camera_id");

-- AddForeignKey
ALTER TABLE "camera_connections" ADD CONSTRAINT "camera_connections_camera_id_fkey" FOREIGN KEY ("camera_id") REFERENCES "cameras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS cameras_location_gix
ON cameras
USING GIST (location);