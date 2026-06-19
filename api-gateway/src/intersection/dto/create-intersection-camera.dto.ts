import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class IntersectionCameraConnectionDto {
  @ApiProperty({
    example: 'rtsp://192.168.1.10:554/Streaming/Channels/102',
  })
  @IsString()
  rtspUrl!: string;

  @ApiPropertyOptional({ example: 'admin' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 'password' })
  @IsOptional()
  @IsString()
  password?: string;
}

export class CreateIntersectionCameraDto {
  @ApiProperty({ example: 'Невский / Литейный — север' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'nevsky-liteyny-north' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    example: 'Камера смотрит на северную часть перекрёстка',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'traffic' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: 59.9366,
    description:
      'Можно не передавать. Тогда камера получит координаты перекрёстка.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    example: 30.3487,
    description:
      'Можно не передавать. Тогда камера получит координаты перекрёстка.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(359)
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

  @ApiProperty({ type: IntersectionCameraConnectionDto })
  @ValidateNested()
  @Type(() => IntersectionCameraConnectionDto)
  connection!: IntersectionCameraConnectionDto;
}