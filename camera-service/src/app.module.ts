import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CameraModule } from './camera/camera.module';
import { EncryptionModule } from './encryption/encryption.module';
import { PrismaModule } from './prisma/prisma.module';
import { IntersectionModule } from './intersection/intersection.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    EncryptionModule,
    CameraModule,
    IntersectionModule,
  ],
})
export class AppModule {}