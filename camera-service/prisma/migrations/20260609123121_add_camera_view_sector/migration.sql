ALTER TABLE cameras
ADD COLUMN direction_deg DOUBLE PRECISION,
ADD COLUMN fov_deg DOUBLE PRECISION NOT NULL DEFAULT 90,
ADD COLUMN range_meters INTEGER NOT NULL DEFAULT 100;

ALTER TABLE cameras
ADD CONSTRAINT cameras_direction_deg_check
CHECK (direction_deg IS NULL OR (direction_deg >= 0 AND direction_deg < 360));

ALTER TABLE cameras
ADD CONSTRAINT cameras_fov_deg_check
CHECK (fov_deg > 0 AND fov_deg <= 180);

ALTER TABLE cameras
ADD CONSTRAINT cameras_range_meters_check
CHECK (range_meters > 0 AND range_meters <= 5000);