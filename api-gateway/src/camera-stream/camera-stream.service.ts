import { Injectable } from '@nestjs/common';
import { KafkaClientService } from '../kafka/kafka-client.service';
import { CameraStreamResponseDto } from './dto/camera-stream-response.dto';
import { PublicCameraDto } from './dto/public-camera.dto';
import { StreamStatusResponseDto } from './dto/stream-status-response.dto';

@Injectable()
export class CameraStreamService {
  constructor(private readonly kafkaClientService: KafkaClientService) {}

  findAllCameras(): Promise<PublicCameraDto[]> {
    return this.kafkaClientService.send<PublicCameraDto[]>(
      'cameras.find_all',
      {},
    );
  }

  findCameraById(cameraId: string): Promise<PublicCameraDto> {
    return this.kafkaClientService.send<PublicCameraDto>(
      'cameras.find_by_id',
      {
        cameraId,
      },
    );
  }

  getStreamByCameraId(cameraId: string): Promise<CameraStreamResponseDto> {
    return this.kafkaClientService.send<CameraStreamResponseDto>(
      'streams.get_by_camera_id',
      {
        cameraId,
      },
    );
  }

  getStreamStatusByCameraId(
    cameraId: string,
  ): Promise<StreamStatusResponseDto> {
    return this.kafkaClientService.send<StreamStatusResponseDto>(
      'streams.get_status_by_camera_id',
      {
        cameraId,
      },
    );
  }
}