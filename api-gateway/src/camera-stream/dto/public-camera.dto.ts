import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicCameraDto {
  @ApiProperty({ example: '6bea819c-c577-422b-b432-3ca75028518f' })
  id!: string;

  @ApiProperty({ example: 'Невский проспект' })
  title!: string;

  @ApiPropertyOptional({ example: 'Камера на Невском проспекте' })
  description?: string;

  @ApiProperty({ example: 59.9343 })
  latitude!: number;

  @ApiProperty({ example: 30.3351 })
  longitude!: number;

  @ApiPropertyOptional({ example: 'spb-nevsky-1' })
  streamPath?: string;

  @ApiPropertyOptional({ example: true })
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'city' })
  category?: string;

  @ApiPropertyOptional({ example: '2026-05-26T18:00:00.000Z' })
  createdAt?: string;

  @ApiPropertyOptional({ example: '2026-05-26T18:00:00.000Z' })
  updatedAt?: string;
}