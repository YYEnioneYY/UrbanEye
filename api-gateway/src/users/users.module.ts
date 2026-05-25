import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { KafkaModule } from '../kafka/kafka.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [KafkaModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}