import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class CameraBboxQueryDto {
  @ApiProperty({ example: 30.1 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  minLng!: number;

  @ApiProperty({ example: 59.8 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  minLat!: number;

  @ApiProperty({ example: 30.6 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  maxLng!: number;

  @ApiProperty({ example: 60.1 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  maxLat!: number;
}