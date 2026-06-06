import { Module } from '@nestjs/common';
import { KafkaModule } from '../kafka/kafka.module';
import { CameraController } from './camera.controller';
import { CameraService } from './camera.service';

@Module({
  imports: [KafkaModule],
  controllers: [CameraController],
  providers: [CameraService],
})
export class CameraModule {}