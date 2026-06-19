import { Module } from '@nestjs/common';
import { EncryptionModule } from '../encryption/encryption.module';
import { PrismaModule } from '../prisma/prisma.module';
import { IntersectionController } from './intersection.controller';
import { IntersectionService } from './intersection.service';

@Module({
  imports: [PrismaModule, EncryptionModule],
  controllers: [IntersectionController],
  providers: [IntersectionService],
})
export class IntersectionModule {}