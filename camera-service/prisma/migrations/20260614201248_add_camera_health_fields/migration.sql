-- CreateEnum
CREATE TYPE "camera_health_status" AS ENUM ('unknown', 'online', 'offline', 'unstable');

-- AlterTable
ALTER TABLE "cameras" ADD COLUMN     "audio_codec" TEXT,
ADD COLUMN     "health_error" TEXT,
ADD COLUMN     "health_status" "camera_health_status" NOT NULL DEFAULT 'unknown',
ADD COLUMN     "last_checked_at" TIMESTAMP(3),
ADD COLUMN     "last_offline_at" TIMESTAMP(3),
ADD COLUMN     "last_online_at" TIMESTAMP(3),
ADD COLUMN     "transcoding_required" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "video_codec" TEXT;
