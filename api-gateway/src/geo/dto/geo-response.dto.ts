import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeoResponseDto {
  @ApiPropertyOptional({ example: '8.8.8.0' })
  ip?: string;

  @ApiPropertyOptional({ example: 'US' })
  country?: string;

  @ApiPropertyOptional({ example: 'California' })
  region?: string;

  @ApiPropertyOptional({ example: 'Mountain View' })
  city?: string;

  @ApiProperty({ example: 37.4056 })
  latitude!: number;

  @ApiProperty({ example: -122.0775 })
  longitude!: number;
}