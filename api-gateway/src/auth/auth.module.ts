import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { KafkaModule } from '../kafka/kafka.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessGuard } from './guards/jwt-access.guard';

@Module({
  imports: [KafkaModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessGuard],
  exports: [JwtAccessGuard, JwtModule],
})
export class AuthModule {}