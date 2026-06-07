import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CameraService } from './camera.service';
import { CreateCameraDto } from './dto/create-camera.dto';
import { FindAdminCamerasDto } from './dto/find-admin-cameras.dto';
import { FindCamerasByBboxDto } from './dto/find-cameras-by-bbox.dto';
import { GetCameraConnectionDto } from './dto/get-camera-connection.dto';

@Controller()
export class CameraController {
  constructor(private readonly cameraService: CameraService) {}

  @MessagePattern('camera.cameras.create')
  create(@Payload() dto: CreateCameraDto) {
    return this.cameraService.create(dto);
  }

  @MessagePattern('camera.cameras.find_by_bbox')
  findByBbox(@Payload() dto: FindCamerasByBboxDto) {
    return this.cameraService.findByBbox(dto);
  }

  @MessagePattern('camera.admin.cameras.find_all')
  findAllAdmin(@Payload() dto: FindAdminCamerasDto) {
    return this.cameraService.findAllAdmin(dto);
  }
}