import { Injectable } from '@nestjs/common';
import { KafkaClientService } from '../kafka/kafka-client.service';
import { AdminCameraQueryDto } from './dto/admin-camera-query.dto';
import { CameraBboxQueryDto } from './dto/camera-bbox-query.dto';
import { CreateCameraDto } from './dto/create-camera.dto';
import { PublicCameraDto } from './dto/public-camera.dto';

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
}