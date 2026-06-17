import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MediaModule } from './media/media.module';
import { PreviewSchedulerModule } from './preview-scheduler/preview-scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ScheduleModule.forRoot(),

    MediaModule,
    PreviewSchedulerModule,
  ],
})
export class AppModule {}