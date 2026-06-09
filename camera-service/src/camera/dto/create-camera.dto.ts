import { Type } from 'class-transformer';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
  IsInt,
} from 'class-validator';

export enum CameraStatusDto {
  online = 'online',
  offline = 'offline',
  maintenance = 'maintenance',
  planned = 'planned',
}

export class CreateCameraConnectionDto {
  @IsString()
  @MinLength(1)
  rtspUrl!: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class CreateCameraDto {
  @IsString()
  @MinLength(2)
  title!: string;

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

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;

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
  fovDeg?: number = 90;
  
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  rangeMeters?: number = 100;

  @ValidateNested()
  @Type(() => CreateCameraConnectionDto)
  connection!: CreateCameraConnectionDto;
}