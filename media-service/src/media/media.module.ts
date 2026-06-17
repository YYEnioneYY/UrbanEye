import { Module } from '@nestjs/common';
import { S3StorageModule } from '../s3-storage/s3-storage.module';
import { MediaController } from './media.controller';

@Module({
  imports: [S3StorageModule],
  controllers: [MediaController],
})
export class MediaModule {}