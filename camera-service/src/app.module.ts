import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CameraModule } from './camera/camera.module';
import { EncryptionModule } from './encryption/encryption.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    EncryptionModule,
    CameraModule,
  ],
})
export class AppModule {}