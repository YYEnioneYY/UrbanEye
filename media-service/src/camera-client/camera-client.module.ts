import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CameraClientService } from './camera-client.service';

@Module({
  imports: [HttpModule],
  providers: [CameraClientService],
  exports: [CameraClientService],
})
export class CameraClientModule {}