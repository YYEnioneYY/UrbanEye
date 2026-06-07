import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CameraHttpClientService } from './camera-http-client.service';

@Module({
  imports: [HttpModule],
  providers: [CameraHttpClientService],
  exports: [CameraHttpClientService],
})
export class CameraHttpClientModule {}