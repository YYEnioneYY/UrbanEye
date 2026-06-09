import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CameraCoordinatesDto {
  @ApiProperty({ example: 59.9398 })
  lat!: number;

  @ApiProperty({ example: 30.3146 })
  lng!: number;
}

class CameraCoverageDto {
  @ApiProperty({
    example: 45,
    nullable: true,
    description: 'Азимут направления камеры: 0 север, 90 восток, 180 юг, 270 запад',
  })
  directionDeg!: number | null;

  @ApiProperty({ example: 90 })
  fovDeg!: number;

  @ApiProperty({ example: 100 })
  rangeMeters!: number;
}

export class PublicCameraDto {
  @ApiProperty({ example: 'b4c606c0-5f8a-4d4c-93c3-90e040f7f6fb' })
  id!: string;

  @ApiProperty({ example: 'Дворцовая площадь' })
  title!: string;

  @ApiProperty({ example: 'palace-square' })
  slug!: string;

  @ApiPropertyOptional({ example: 'Камера с видом на Дворцовую площадь' })
  description!: string | null;

  @ApiProperty({
    example: 'online',
    enum: ['online', 'offline', 'maintenance', 'planned'],
  })
  status!: 'online' | 'offline' | 'maintenance' | 'planned';

  @ApiPropertyOptional({ example: 'Санкт-Петербург' })
  city!: string | null;

  @ApiPropertyOptional({ example: 'Дворцовая площадь' })
  address!: string | null;

  @ApiPropertyOptional({ example: 'landmark' })
  category!: string | null;

  @ApiProperty({ type: CameraCoordinatesDto })
  coordinates!: CameraCoordinatesDto;

  @ApiProperty({ type: CameraCoverageDto })
  coverage!: CameraCoverageDto;

  @ApiProperty({ example: '2026-05-27T18:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-05-27T18:00:00.000Z' })
  updatedAt!: string;
}