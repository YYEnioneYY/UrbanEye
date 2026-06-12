import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CameraStatusDto } from './create-camera.dto';

export class UpdateCameraConnectionDto {
  @ApiPropertyOptional({ example: 'rtsp://192.168.1.10:554/stream1' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  rtspUrl?: string;

  @ApiPropertyOptional({ example: 'admin' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 'secret' })
  @IsOptional()
  @IsString()
  password?: string;
}

export class UpdateCameraDto {
  @ApiPropertyOptional({ example: 'Дворцовая площадь' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @ApiPropertyOptional({ example: 'spb-palace-square' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    example: 'Камера с видом на Дворцовую площадь',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'online',
    enum: CameraStatusDto,
  })
  @IsOptional()
  @IsEnum(CameraStatusDto)
  status?: CameraStatusDto;

  @ApiPropertyOptional({ example: 'Санкт-Петербург' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Дворцовая площадь' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'landmark' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 59.9398 })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ example: 30.3146 })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Азимут направления камеры: 0 север, 90 восток, 180 юг, 270 запад',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(359.999)
  directionDeg?: number;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(180)
  fovDeg?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  rangeMeters?: number;

  @ApiPropertyOptional({ type: UpdateCameraConnectionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCameraConnectionDto)
  connection?: UpdateCameraConnectionDto;
}