import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StreamsModule } from './modules/streams/streams.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    StreamsModule,
  ],
})
export class AppModule {}