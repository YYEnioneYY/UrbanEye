import { Module } from '@nestjs/common';
import { CameraClientModule } from '../camera-client/camera-client.module';
import { CameraEventsModule } from '../events/camera-events.module';
import { EventSourceRunnerService } from './event-source-runner.service';

@Module({
  imports: [CameraClientModule, CameraEventsModule],
  providers: [EventSourceRunnerService],
})
export class EventSourceRunnerModule {}