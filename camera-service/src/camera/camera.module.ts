import { Module } from '@nestjs/common';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { EncryptionModule } from '../encryption/encryption.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CameraController } from './camera.controller';
import { CameraService } from './camera.service';
import { InternalCameraController } from './internal-camera.controller';

@Module({
  imports: [PrismaModule, EncryptionModule],
  controllers: [CameraController, InternalCameraController],
  providers: [CameraService, InternalApiKeyGuard],
})
export class CameraModule {}