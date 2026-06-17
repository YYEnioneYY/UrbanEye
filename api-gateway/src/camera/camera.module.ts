import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { KafkaModule } from '../kafka/kafka.module';
import { CameraController } from './camera.controller';
import { CameraService } from './camera.service';
import { MediaClientModule } from '../media-client/media-client.module';

@Module({
  imports: [KafkaModule, AuthModule, MediaClientModule],
  controllers: [CameraController],
  providers: [CameraService],
})
export class CameraModule {}