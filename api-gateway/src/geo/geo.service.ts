import { Injectable } from '@nestjs/common';
import { KafkaClientService } from '../kafka/kafka-client.service';
import { GeoResponseDto } from './dto/geo-response.dto';

@Injectable()
export class GeoService {
  constructor(private readonly kafkaClientService: KafkaClientService) {}

  getMe(ip: string): Promise<GeoResponseDto> {
    return this.kafkaClientService.send<GeoResponseDto>('geo.me', {
      ip,
    });
  }
}