import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StreamsModule } from './streams/streams.module';
import { MediamtxModule } from './mediamtx/mediamtx.module';
import { CameraHttpClientModule } from './camera-http-client/camera-http-client.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    StreamsModule,
    MediamtxModule,
    CameraHttpClientModule,
  ],
})
export class AppModule {}