import { Module } from '@nestjs/common';
import { StreamsController } from './streams.controller';
import { StreamsService } from './streams.service';
import { MediaServerClient } from './media-server.client';
import { CamerasRepository } from './cameras.repository';
import { StreamsBootstrap } from './streams.bootstrap';

@Module({
  controllers: [StreamsController],
  providers: [
    StreamsService,
    MediaServerClient,
    CamerasRepository,
    StreamsBootstrap,
  ],
})
export class StreamsModule {}