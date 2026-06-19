import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class FindIntersectionsBboxDto {
  @ApiProperty({ example: 59 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  minLat!: number;

  @ApiProperty({ example: 60 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  maxLat!: number;

  @ApiProperty({ example: 30 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  minLng!: number;

  @ApiProperty({ example: 31 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  maxLng!: number;
}