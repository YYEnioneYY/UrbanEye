import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, UserModule, JwtModule.register({}), HttpModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}