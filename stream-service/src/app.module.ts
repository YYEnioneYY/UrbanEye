import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CamerasModule } from './cameras/cameras.module';
import { StreamsModule } from './streams/streams.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CamerasModule,
    StreamsModule,
  ],
})
export class AppModule {}