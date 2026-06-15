import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CameraClientModule } from './camera-client/camera-client.module';
import { FfprobeModule } from './ffprobe/ffprobe.module';
import { HealthCheckModule } from './health-check/health-check.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),

    CameraClientModule,
    FfprobeModule,
    HealthCheckModule,
  ],
})
export class AppModule {}