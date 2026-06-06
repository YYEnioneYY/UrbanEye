import { Injectable } from '@nestjs/common';
import { KafkaClientService } from '../kafka/kafka-client.service';
import { PublicCameraDto } from './dto/public-camera.dto';

@Injectable()
export class CameraService {
  constructor(private readonly kafkaClientService: KafkaClientService) {}

  findAll(): Promise<PublicCameraDto[]> {
    return this.kafkaClientService.send<PublicCameraDto[]>(
      'camera.cameras.find_all',
      {},
    );
  }
}