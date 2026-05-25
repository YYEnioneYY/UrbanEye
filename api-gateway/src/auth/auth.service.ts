import { Injectable } from '@nestjs/common';
import { KafkaClientService } from '../kafka/kafka-client.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponse } from './types/auth-response.type';

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly kafkaClientService: KafkaClientService) {}

  register(dto: RegisterDto, meta: RequestMeta): Promise<AuthResponse> {
    return this.kafkaClientService.send<AuthResponse>('auth.register', {
      ...dto,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });
  }

  login(dto: LoginDto, meta: RequestMeta): Promise<AuthResponse> {
    return this.kafkaClientService.send<AuthResponse>('auth.login', {
      ...dto,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });
  }

  refresh(refreshToken: string, meta: RequestMeta): Promise<AuthResponse> {
    return this.kafkaClientService.send<AuthResponse>('auth.refresh', {
      refreshToken,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });
  }

  logout(refreshToken: string): Promise<{ success: boolean }> {
    return this.kafkaClientService.send<{ success: boolean }>('auth.logout', {
      refreshToken,
    });
  }

  forgotPassword(dto: ForgotPasswordDto): Promise<{ success: boolean }> {
    return this.kafkaClientService.send<{ success: boolean }>(
      'auth.forgot-password',
      dto,
    );
  }

  resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean }> {
    return this.kafkaClientService.send<{ success: boolean }>(
      'auth.reset-password',
      dto,
    );
  }
}