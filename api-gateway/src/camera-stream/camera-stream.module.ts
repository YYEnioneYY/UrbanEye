import { Module } from '@nestjs/common';
import { KafkaModule } from '../kafka/kafka.module';
import { CameraStreamController } from './camera-stream.controller';
import { CameraStreamService } from './camera-stream.service';

@Module({
  imports: [KafkaModule],
  controllers: [CameraStreamController],
  providers: [CameraStreamService],
})
export class CameraStreamModule {}