import { Injectable } from '@nestjs/common';
import { KafkaClientService } from '../kafka/kafka-client.service';
import { PublicUser } from '../auth/types/auth-response.type';

@Injectable()
export class UsersService {
  constructor(private readonly kafkaClientService: KafkaClientService) {}

  getUserById(id: string): Promise<PublicUser> {
    return this.kafkaClientService.send<PublicUser>('user.get-by-id', {
      id,
    });
  }
}