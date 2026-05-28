import { Controller, Get, Param } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CamerasService } from './cameras.service';

@Controller('cameras')
export class CamerasController {
  constructor(private readonly camerasService: CamerasService) {}

  /**
   * HTTP:
   * GET /cameras
   */
  @Get()
  findAllHttp() {
    return this.camerasService.findAll();
  }

  @Get(':cameraId')
  findByIdHttp(@Param('cameraId') cameraId: string) {
    return this.camerasService.findById(cameraId);
  }

  @MessagePattern('cameras.find_all')
  findAllKafka() {
    return this.camerasService.findAll();
  }

  @MessagePattern('cameras.find_by_id')
  findByIdKafka(@Payload() payload: { cameraId: string }) {
    return this.camerasService.findById(payload.cameraId);
  }
}