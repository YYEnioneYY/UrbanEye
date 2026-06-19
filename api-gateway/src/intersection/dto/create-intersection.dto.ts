import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateIntersectionDto {
  @ApiProperty({ example: 'Невский / Литейный' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'nevsky-liteyny' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    example: 'Перекрёсток с несколькими камерами',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Санкт-Петербург' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    example: 'Невский проспект / Литейный проспект',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'traffic' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 59.9365 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: 30.3486 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}