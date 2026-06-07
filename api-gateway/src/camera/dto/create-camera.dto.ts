import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export enum CameraStatusDto {
  online = 'online',
  offline = 'offline',
  maintenance = 'maintenance',
  planned = 'planned',
}

export class CreateCameraConnectionDto {
  @ApiProperty({ example: 'rtsp://user:pass@192.168.1.10:554/stream1' })
  @IsString()
  @MinLength(1)
  rtspUrl!: string;

  @ApiPropertyOptional({ example: 'admin' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 'secret_password' })
  @IsOptional()
  @IsString()
  password?: string;
}

export class CreateCameraDto {
  @ApiProperty({ example: 'Дворцовая площадь' })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiPropertyOptional({ example: 'palace-square' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Камера с видом на Дворцовую площадь' })
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

  @ApiProperty({ example: 59.9398 })
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 30.3146 })
  @IsLongitude()
  longitude!: number;

  @ApiProperty({ type: CreateCameraConnectionDto })
  @ValidateNested()
  @Type(() => CreateCameraConnectionDto)
  connection!: CreateCameraConnectionDto;
}