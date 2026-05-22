import { Controller, Get, Param } from '@nestjs/common';
import { StreamsService } from './streams.service';

@Controller('streams')
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Get(':cameraId')
  getStream(@Param('cameraId') cameraId: string) {
    return this.streamsService.getStream(cameraId);
  }

  @Get(':cameraId/status')
  getStatus(@Param('cameraId') cameraId: string) {
    return this.streamsService.getStatus(cameraId);
  }
}