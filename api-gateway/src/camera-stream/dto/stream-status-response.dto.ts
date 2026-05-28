import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StreamStatusResponseDto {
  @ApiProperty({ example: '6bea819c-c577-422b-b432-3ca75028518f' })
  cameraId!: string;

  @ApiProperty({ example: 'camera/spb-nevsky-1' })
  path!: string;

  @ApiProperty({ example: true })
  configured!: boolean;

  @ApiProperty({ example: true })
  online!: boolean;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
  })
  mediaServerPath!: unknown | null;
}