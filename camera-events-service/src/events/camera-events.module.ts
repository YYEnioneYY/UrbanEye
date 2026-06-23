import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { S3StorageModule } from '../s3-storage/s3-storage.module';
import { CameraEventsController } from './camera-events.controller';
import { CameraEventsGateway } from './camera-events.gateway';
import { CameraEventsService } from './camera-events.service';

@Module({
  imports: [PrismaModule, S3StorageModule],
  controllers: [CameraEventsController],
  providers: [CameraEventsGateway, CameraEventsService],
  exports: [CameraEventsGateway, CameraEventsService],
})
export class CameraEventsModule {}