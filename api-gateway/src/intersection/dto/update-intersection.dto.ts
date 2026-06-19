import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum IntersectionStatusDto {
  active = 'active',
  hidden = 'hidden',
  maintenance = 'maintenance',
}

export class UpdateIntersectionDto {
  @ApiPropertyOptional({ example: 'Невский / Литейный' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'nevsky-liteyny' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Описание перекрёстка', nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'Санкт-Петербург', nullable: true })
  @IsOptional()
  @IsString()
  city?: string | null;

  @ApiPropertyOptional({ example: 'Невский / Литейный', nullable: true })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional({ example: 'traffic', nullable: true })
  @IsOptional()
  @IsString()
  category?: string | null;

  @ApiPropertyOptional({
    example: 'active',
    enum: IntersectionStatusDto,
  })
  @IsOptional()
  @IsEnum(IntersectionStatusDto)
  status?: IntersectionStatusDto;

  @ApiPropertyOptional({ example: 59.9365 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 30.3486 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}