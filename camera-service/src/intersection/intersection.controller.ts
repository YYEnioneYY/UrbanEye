import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateIntersectionDto } from './dto/create-intersection.dto';
import { CreateIntersectionCameraDto } from './dto/create-intersection-camera.dto';
import { FindIntersectionsBboxDto } from './dto/find-intersections-bbox.dto';
import { UpdateIntersectionDto } from './dto/update-intersection.dto';
import { IntersectionService } from './intersection.service';

@Controller()
export class IntersectionController {
  constructor(private readonly intersectionService: IntersectionService) {}

  @MessagePattern('camera.public.intersections.find_by_bbox')
  findByBbox(@Payload() dto: FindIntersectionsBboxDto) {
    return this.intersectionService.findByBbox(dto);
  }

  @MessagePattern('camera.public.intersections.find_by_id')
  findById(@Payload() payload: { intersectionId: string }) {
    return this.intersectionService.findById(payload.intersectionId);
  }

  @MessagePattern('camera.public.intersections.find_cameras_by_id')
  findPublicCameras(@Payload() payload: { intersectionId: string }) {
    return this.intersectionService.findPublicCameras(payload.intersectionId);
  }

  @MessagePattern('camera.admin.intersections.create')
  create(@Payload() dto: CreateIntersectionDto) {
    return this.intersectionService.create(dto);
  }

  @MessagePattern('camera.admin.intersections.find_all')
  findAllAdmin() {
    return this.intersectionService.findAllAdmin();
  }

  @MessagePattern('camera.admin.intersections.find_by_id')
  findByIdAdmin(@Payload() payload: { intersectionId: string }) {
    return this.intersectionService.findByIdAdmin(payload.intersectionId);
  }

  @MessagePattern('camera.admin.intersections.update')
  update(
    @Payload()
    payload: {
      intersectionId: string;
      dto: UpdateIntersectionDto;
    },
  ) {
    return this.intersectionService.update(
      payload.intersectionId,
      payload.dto,
    );
  }

  @MessagePattern('camera.admin.intersections.delete')
  delete(@Payload() payload: { intersectionId: string }) {
    return this.intersectionService.delete(payload.intersectionId);
  }

  @MessagePattern('camera.admin.intersections.create_camera')
  createCamera(
    @Payload()
    payload: {
      intersectionId: string;
      dto: CreateIntersectionCameraDto;
    },
  ) {
    return this.intersectionService.createCamera(
      payload.intersectionId,
      payload.dto,
    );
  }

  @MessagePattern('camera.admin.intersections.find_cameras')
  findCameras(@Payload() payload: { intersectionId: string }) {
    return this.intersectionService.findCameras(payload.intersectionId);
  }
}