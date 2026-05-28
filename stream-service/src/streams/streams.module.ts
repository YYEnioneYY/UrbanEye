import { Module } from '@nestjs/common';
import { CamerasModule } from '../cameras/cameras.module';
import { MediaServerClient } from './media-server.client';
import { StreamsBootstrap } from './streams.bootstrap';
import { StreamsController } from './streams.controller';
import { StreamsService } from './streams.service';

@Module({
  imports: [CamerasModule],
  controllers: [StreamsController],
  providers: [StreamsService, StreamsBootstrap, MediaServerClient],
})
export class StreamsModule {}