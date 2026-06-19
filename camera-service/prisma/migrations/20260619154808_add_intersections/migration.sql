-- CreateEnum
CREATE TYPE "intersection_status" AS ENUM ('active', 'hidden', 'maintenance');

-- AlterTable
ALTER TABLE "cameras" ADD COLUMN     "intersection_id" UUID,
ADD COLUMN     "map_visible" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "intersections" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT,
    "address" TEXT,
    "category" TEXT,
    "status" "intersection_status" NOT NULL DEFAULT 'active',
    "location" geometry(Point, 4326) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "intersections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "intersections_slug_key" ON "intersections"("slug");

-- AddForeignKey
ALTER TABLE "cameras" ADD CONSTRAINT "cameras_intersection_id_fkey" FOREIGN KEY ("intersection_id") REFERENCES "intersections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
