import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { KafkaModule } from '../kafka/kafka.module';
import { StorageModule } from '../storage/storage.module';
import { CameraController } from './camera.controller';
import { CameraService } from './camera.service';

@Module({
  imports: [KafkaModule, AuthModule, StorageModule],
  controllers: [CameraController],
  providers: [CameraService],
})
export class CameraModule {}