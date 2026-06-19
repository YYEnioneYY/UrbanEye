import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { KafkaModule } from '../kafka/kafka.module';
import { AdminIntersectionController } from './admin-intersection.controller';
import { IntersectionController } from './intersection.controller';
import { IntersectionService } from './intersection.service';

@Module({
  imports: [KafkaModule, AuthModule],
  controllers: [IntersectionController, AdminIntersectionController],
  providers: [IntersectionService],
})
export class IntersectionModule {}