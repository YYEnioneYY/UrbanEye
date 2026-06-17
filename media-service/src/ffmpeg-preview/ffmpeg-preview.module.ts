import { Module } from '@nestjs/common';
import { FfmpegPreviewService } from './ffmpeg-preview.service';

@Module({
  providers: [FfmpegPreviewService],
  exports: [FfmpegPreviewService],
})
export class FfmpegPreviewModule {}