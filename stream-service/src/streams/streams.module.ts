import { Module } from '@nestjs/common';
import { CameraHttpClientModule } from '../camera-http-client/camera-http-client.module';
import { MediamtxModule } from '../mediamtx/mediamtx.module';
import { StreamsController } from './streams.controller';
import { StreamsService } from './streams.service';
import { TranscodingModule } from '../transcoding/transcoding.module';

@Module({
  imports: [CameraHttpClientModule, MediamtxModule, TranscodingModule],
  controllers: [StreamsController],
  providers: [StreamsService],
})
export class StreamsModule {}