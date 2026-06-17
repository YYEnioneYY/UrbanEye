import { Module } from '@nestjs/common';
import { CameraClientModule } from '../camera-client/camera-client.module';
import { FfmpegPreviewModule } from '../ffmpeg-preview/ffmpeg-preview.module';
import { S3StorageModule } from '../s3-storage/s3-storage.module';
import { PreviewSchedulerService } from './preview-scheduler.service';

@Module({
  imports: [CameraClientModule, FfmpegPreviewModule, S3StorageModule],
  providers: [PreviewSchedulerService],
})
export class PreviewSchedulerModule {}