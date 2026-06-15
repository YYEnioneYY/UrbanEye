import { Module } from '@nestjs/common';
import { CameraClientModule } from '../camera-client/camera-client.module';
import { FfprobeModule } from '../ffprobe/ffprobe.module';
import { HealthCheckService } from './health-check.service';

@Module({
  imports: [CameraClientModule, FfprobeModule],
  providers: [HealthCheckService],
})
export class HealthCheckModule {}