import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CameraClientModule } from './camera-client/camera-client.module';
import { CameraEventsModule } from './events/camera-events.module';
import { EventSourceRunnerModule } from './event-source-runner/event-source-runner.module';
import { PrismaModule } from '../prisma/prisma.module';
import { S3StorageModule } from './s3-storage/s3-storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ScheduleModule.forRoot(),

    PrismaModule,
    CameraClientModule,
    S3StorageModule,
    CameraEventsModule,
    EventSourceRunnerModule,
  ],
})
export class AppModule {}