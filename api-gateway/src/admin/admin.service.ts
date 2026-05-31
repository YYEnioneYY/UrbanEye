import { Injectable } from '@nestjs/common';
import { KafkaClientService } from '../kafka/kafka-client.service';
import { AuthServiceStatusDto } from './dto/auth-service-status.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UsersListResponseDto } from './dto/users-list-response.dto';

@Injectable()
export class AdminService {
  constructor(private readonly kafkaClientService: KafkaClientService) {}

  getAuthServiceStatus(): Promise<AuthServiceStatusDto> {
    return this.kafkaClientService.send<AuthServiceStatusDto>(
      'auth.service.status',
      {},
    );
  }

  getUsers(query: FindUsersQueryDto): Promise<UsersListResponseDto> {
    return this.kafkaClientService.send<UsersListResponseDto>(
      'users.find_all',
      {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        search: query.search,
        includeDeleted: query.includeDeleted ?? false,
      },
    );
  }
}