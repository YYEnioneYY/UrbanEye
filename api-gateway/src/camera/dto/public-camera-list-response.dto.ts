import { ApiProperty } from '@nestjs/swagger';
import { PublicCameraDto } from './public-camera.dto';

export class CameraPaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 150 })
  total!: number;

  @ApiProperty({ example: 8 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNextPage!: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage!: boolean;
}

export class PublicCameraListResponseDto {
  @ApiProperty({ type: PublicCameraDto, isArray: true })
  data!: PublicCameraDto[];

  @ApiProperty({ type: CameraPaginationMetaDto })
  meta!: CameraPaginationMetaDto;
}