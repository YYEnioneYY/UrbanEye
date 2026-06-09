import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude } from 'class-validator';

export class CamerasLookingAtPointQueryDto {
  @ApiProperty({ example: 59.9398 })
  @Type(() => Number)
  @IsLatitude()
  lat!: number;

  @ApiProperty({ example: 30.3146 })
  @Type(() => Number)
  @IsLongitude()
  lng!: number;
}