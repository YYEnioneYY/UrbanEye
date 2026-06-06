import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CameraService } from './camera.service';

@Controller()
export class CameraController {
  constructor(private readonly cameraService: CameraService) {}

  @MessagePattern('camera.cameras.find_all')
  findAll() {
    return this.cameraService.findAll();
  }
}