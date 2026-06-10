import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CameraService } from './camera.service';
import { CreateCameraDto } from './dto/create-camera.dto';
import { FindAdminCamerasDto } from './dto/find-admin-cameras.dto';
import { FindCamerasByBboxDto } from './dto/find-cameras-by-bbox.dto';
import { FindPublicCamerasDto } from './dto/find-public-cameras.dto';
import { FindCamerasLookingAtPointDto } from './dto/find-cameras-looking-at-point.dto';
import { FindCameraByIdDto } from './dto/find-camera-by-id.dto';

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

  @MessagePattern('camera.public.cameras.find_all')
  findAllPublic(@Payload() dto: FindPublicCamerasDto) {
    return this.cameraService.findAllPublic(dto);
  }

  @MessagePattern('camera.cameras.find_looking_at_point')
  findLookingAtPoint(@Payload() dto: FindCamerasLookingAtPointDto) {
    return this.cameraService.findLookingAtPoint(dto);
  }

  @MessagePattern('camera.public.cameras.find_by_id')
  findById(@Payload() dto: FindCameraByIdDto) {
    return this.cameraService.findById(dto.cameraId);
  }
}