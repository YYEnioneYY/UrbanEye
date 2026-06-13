import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { CameraStatusDto } from './create-camera.dto';

export class UpdateCameraConnectionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  rtspUrl?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class UpdateCameraDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(CameraStatusDto)
  status?: CameraStatusDto;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  previewUrl?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(359.999)
  directionDeg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(180)
  fovDeg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  rangeMeters?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCameraConnectionDto)
  connection?: UpdateCameraConnectionDto;
}

export class UpdateCameraPayloadDto extends UpdateCameraDto {
  @IsUUID()
  cameraId!: string;
}