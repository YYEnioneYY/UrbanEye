import { Module } from '@nestjs/common';
import { CamerasController } from './cameras.controller';
import { CamerasRepository } from './cameras.repository';
import { CamerasService } from './cameras.service';

@Module({
  controllers: [CamerasController],
  providers: [CamerasService, CamerasRepository],
  exports: [CamerasService, CamerasRepository],
})
export class CamerasModule {}