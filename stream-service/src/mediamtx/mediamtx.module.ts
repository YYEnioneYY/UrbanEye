import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MediamtxService } from './mediamtx.service';

@Module({
  imports: [HttpModule],
  providers: [MediamtxService],
  exports: [MediamtxService],
})
export class MediamtxModule {}