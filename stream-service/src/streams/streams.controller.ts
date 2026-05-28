import { Controller, Get, Param } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StreamsService } from './streams.service';

@Controller('streams')
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Get(':cameraId')
  getStreamByCameraIdHttp(@Param('cameraId') cameraId: string) {
    return this.streamsService.getStreamByCameraId(cameraId);
  }

  @Get(':cameraId/status')
  getStatusByCameraIdHttp(@Param('cameraId') cameraId: string) {
    return this.streamsService.getStatusByCameraId(cameraId);
  }

  @MessagePattern('streams.get_by_camera_id')
  getStreamByCameraIdKafka(@Payload() payload: { cameraId: string }) {
    return this.streamsService.getStreamByCameraId(payload.cameraId);
  }

  @MessagePattern('streams.get_status_by_camera_id')
  getStatusByCameraIdKafka(@Payload() payload: { cameraId: string }) {
    return this.streamsService.getStatusByCameraId(payload.cameraId);
  }
}