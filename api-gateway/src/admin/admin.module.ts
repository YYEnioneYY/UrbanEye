import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { KafkaModule } from '../kafka/kafka.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { GatewayStatusService } from './gateway-status.service';

@Module({
  imports: [KafkaModule, AuthModule],
  controllers: [AdminController],
  providers: [AdminService, GatewayStatusService],
})
export class AdminModule {}