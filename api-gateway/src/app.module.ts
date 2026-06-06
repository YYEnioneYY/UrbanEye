import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { KafkaModule } from './kafka/kafka.module';
import { UsersModule } from './users/users.module';
import { GeoModule } from './geo/geo.module';
import { CameraStreamModule } from './camera-stream/camera-stream.module';
import { AdminModule } from './admin/admin.module';
import { CameraModule } from './camera/camera.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    KafkaModule,
    AuthModule,
    UsersModule,
    GeoModule,
    CameraStreamModule,
    AdminModule,
    CameraModule,
  ],
})
export class AppModule {}