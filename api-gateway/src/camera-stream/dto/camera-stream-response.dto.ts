import { ApiProperty } from '@nestjs/swagger';
import { PublicCameraDto } from './public-camera.dto';

export class StreamInfoDto {
  @ApiProperty({ example: 'webrtc' })
  type!: 'webrtc';

  @ApiProperty({ example: 'camera/spb-nevsky-1' })
  path!: string;

  @ApiProperty({
    example: 'http://localhost:8889/camera/spb-nevsky-1',
  })
  playerUrl!: string;

  @ApiProperty({
    example: 'http://localhost:8889/camera/spb-nevsky-1/whep',
  })
  whepUrl!: string;
}

export class CameraStreamResponseDto {
  @ApiProperty({ type: PublicCameraDto })
  camera!: PublicCameraDto;

  @ApiProperty({ type: StreamInfoDto })
  stream!: StreamInfoDto;
}