import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MediaClientService } from './media-client.service';

@Module({
  imports: [HttpModule],
  providers: [MediaClientService],
  exports: [MediaClientService],
})
export class MediaClientModule {}