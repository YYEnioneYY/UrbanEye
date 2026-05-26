import { Module } from '@nestjs/common';
import { KafkaModule } from '../kafka/kafka.module';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';

@Module({
  imports: [KafkaModule],
  controllers: [GeoController],
  providers: [GeoService],
})
export class GeoModule {}