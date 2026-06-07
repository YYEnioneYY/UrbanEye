import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StreamsService } from './streams.service';

type CameraIdPayload = {
  cameraId: string;
};

@Controller()
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @MessagePattern('streams.get_by_camera_id')
  getByCameraId(@Payload() payload: CameraIdPayload) {
    console.log('[stream-service] streams.get_by_camera_id received:', payload);

    return this.streamsService.getByCameraId(payload.cameraId);
  }

  @MessagePattern('streams.get_status_by_camera_id')
  getStatusByCameraId(@Payload() payload: CameraIdPayload) {
    console.log(
      '[stream-service] streams.get_status_by_camera_id received:',
      payload,
    );

    return this.streamsService.getStatusByCameraId(payload.cameraId);
  }
}