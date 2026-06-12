import { Injectable } from '@nestjs/common';
import { KafkaClientService } from '../kafka/kafka-client.service';
import { AdminCameraQueryDto } from './dto/admin-camera-query.dto';
import { CameraBboxQueryDto } from './dto/camera-bbox-query.dto';
import { CreateCameraDto } from './dto/create-camera.dto';
import { PublicCameraDto } from './dto/public-camera.dto';
import { PublicCameraListResponseDto } from './dto/public-camera-list-response.dto';
import { PublicCameraQueryDto } from './dto/public-camera-query.dto';
import { CamerasLookingAtPointQueryDto } from './dto/cameras-looking-at-point-query.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';

@Injectable()
export class CameraService {
  constructor(private readonly kafkaClientService: KafkaClientService) {}

  create(dto: CreateCameraDto): Promise<PublicCameraDto> {
    return this.kafkaClientService.send<PublicCameraDto>(
      'camera.cameras.create',
      dto,
    );
  }

  findByBbox(query: CameraBboxQueryDto): Promise<PublicCameraDto[]> {
    return this.kafkaClientService.send<PublicCameraDto[]>(
      'camera.cameras.find_by_bbox',
      query,
    );
  }

  findAllAdmin(query: AdminCameraQueryDto) {
    return this.kafkaClientService.send('camera.admin.cameras.find_all', {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      search: query.search,
      includeDeleted: query.includeDeleted ?? false,
    });
  }

  findAllPublic(
    query: PublicCameraQueryDto,
  ): Promise<PublicCameraListResponseDto> {
    return this.kafkaClientService.send<PublicCameraListResponseDto>(
      'camera.public.cameras.find_all',
      {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        search: query.search,
        status: query.status,
        city: query.city,
        category: query.category,
      },
    );
  }

  findLookingAtPoint(query: CamerasLookingAtPointQueryDto) {
    return this.kafkaClientService.send(
      'camera.cameras.find_looking_at_point',
      {
        lat: query.lat,
        lng: query.lng,
      },
    );
  }

  findById(cameraId: string): Promise<PublicCameraDto> {
    return this.kafkaClientService.send<PublicCameraDto>(
      'camera.public.cameras.find_by_id',
      {
        cameraId,
      },
    );
  }

  update(cameraId: string, dto: UpdateCameraDto): Promise<PublicCameraDto> {
    return this.kafkaClientService.send<PublicCameraDto>(
      'camera.admin.cameras.update',
      {
        cameraId,
        ...dto,
      },
    );
  }
  
  delete(cameraId: string) {
    return this.kafkaClientService.send('camera.admin.cameras.delete', {
      cameraId,
    });
  }
}