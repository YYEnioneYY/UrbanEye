import { Injectable } from '@nestjs/common';
import { KafkaClientService } from '../kafka/kafka-client.service';
import { AuthServiceStatusDto } from './dto/auth-service-status.dto';

@Injectable()
export class AdminService {
  constructor(private readonly kafkaClientService: KafkaClientService) {}

  getAuthServiceStatus(): Promise<AuthServiceStatusDto> {
    return this.kafkaClientService.send<AuthServiceStatusDto>(
      'auth.service.status',
      {},
    );
  }
}