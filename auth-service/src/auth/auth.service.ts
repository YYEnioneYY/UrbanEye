import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { Prisma } from '../generated/prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { PublicUser, publicUserSelect } from '../user/user.select';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from './types/jwt-payload.types';

import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

type AuthResponse = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;
  private readonly passwordResetTtlMinutes: number;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecret = configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret = configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    this.accessTtlSeconds = Number(
      configService.get('JWT_ACCESS_TTL_SECONDS') ?? 900,
    );

    this.refreshTtlSeconds = Number(
      configService.get('JWT_REFRESH_TTL_SECONDS') ?? 60 * 60 * 24 * 30,
    );

    this.passwordResetTtlMinutes = Number(
      configService.get('PASSWORD_RESET_TTL_MINUTES') ?? 15,
    );
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const user = await this.userService.createUser({
      email: dto.email,
      password: dto.password,
    });

    void this.sendAccountCreatedNotification(user.email);

    return this.createAuthResponse(user, {
      userAgent: dto.userAgent,
      ipAddress: dto.ipAddress,
    });
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw this.invalidCredentialsException();
    }

    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!isPasswordValid) {
      throw this.invalidCredentialsException();
    }

    const publicUser: PublicUser = {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };

    return this.createAuthResponse(publicUser, {
      userAgent: dto.userAgent,
      ipAddress: dto.ipAddress,
    });
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponse> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);

    const session = await this.prisma.refreshSession.findUnique({
      where: {
        id: payload.sid,
      },
      include: {
        user: {
          select: publicUserSelect,
        },
      },
    });

    if (!session || session.revokedAt) {
      throw this.invalidRefreshTokenException();
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      throw this.invalidRefreshTokenException();
    }

    const incomingTokenHash = this.createTokenHash(dto.refreshToken);

    if (incomingTokenHash !== session.tokenHash) {
      throw this.invalidRefreshTokenException();
    }

    if (session.user.deletedAt) {
      throw this.invalidRefreshTokenException();
    }

    await this.prisma.refreshSession.update({
      where: {
        id: session.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return this.createAuthResponse(session.user, {
      userAgent: dto.userAgent,
      ipAddress: dto.ipAddress,
    });
  }

  async logout(dto: LogoutDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);

    await this.prisma.refreshSession.updateMany({
      where: {
        id: payload.sid,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      success: true,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      return {
        success: true,
      };
    }

    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.createTokenHash(rawToken);

    const expiresAt = new Date(
      Date.now() + this.passwordResetTtlMinutes * 60 * 1000,
    );

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    void this.sendPasswordResetNotification(dto.email, rawToken);

    return {
      success: true,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.createTokenHash(dto.token);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
    });

    if (!resetToken || resetToken.usedAt) {
      throw new RpcException({
        statusCode: 400,
        code: 'INVALID_RESET_TOKEN',
        message: 'Invalid reset token',
      });
    }

    if (resetToken.expiresAt.getTime() <= Date.now()) {
      throw new RpcException({
        statusCode: 400,
        code: 'RESET_TOKEN_EXPIRED',
        message: 'Reset token expired',
      });
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          passwordHash,
        },
      }),

      this.prisma.passwordResetToken.update({
        where: {
          id: resetToken.id,
        },
        data: {
          usedAt: new Date(),
        },
      }),

      this.prisma.refreshSession.updateMany({
        where: {
          userId: resetToken.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);

    return {
      success: true,
    };
  }

  private async createAuthResponse(
    user: PublicUser,
    meta?: {
      userAgent?: string;
      ipAddress?: string;
    },
  ): Promise<AuthResponse> {
    const accessToken = await this.createAccessToken(user);
    const refreshToken = await this.createRefreshToken(user, meta);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  private async createAccessToken(user: PublicUser): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessTtlSeconds,
    });
  }

  private async createRefreshToken(
    user: PublicUser,
    meta?: {
      userAgent?: string;
      ipAddress?: string;
    },
  ): Promise<string> {
    const sessionId = randomUUID();

    const payload: RefreshTokenPayload = {
      sub: user.id,
      sid: sessionId,
      type: 'refresh',
    };

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshTtlSeconds,
    });

    await this.prisma.refreshSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        tokenHash: this.createTokenHash(refreshToken),
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
        expiresAt: new Date(Date.now() + this.refreshTtlSeconds * 1000),
      },
    });

    return refreshToken;
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.refreshSecret,
        },
      );

      if (payload.type !== 'refresh') {
        throw this.invalidRefreshTokenException();
      }

      return payload;
    } catch {
      throw this.invalidRefreshTokenException();
    }
  }

  private createTokenHash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async sendAccountCreatedNotification(email: string): Promise<void> {
  const notificationServiceUrl = this.configServiceUrl();

  try {
    await firstValueFrom(
      this.httpService.post(
        `${notificationServiceUrl}/internal/notifications/account-created`,
        {
          email,
        },
        {
          headers: this.internalHeaders(),
        },
      ),
    );
  } catch (error) {
    this.logger.error(
      `Failed to send account created notification to ${email}`,
      error,
    );
  }
}

private async sendPasswordResetNotification(
    email: string,
    resetToken: string,
  ): Promise<void> {
    const notificationServiceUrl = this.configServiceUrl();
  
    try {
      await firstValueFrom(
        this.httpService.post(
          `${notificationServiceUrl}/internal/notifications/password-reset`,
          {
            email,
            resetToken,
          },
          {
            headers: this.internalHeaders(),
          },
        ),
      );
    } catch (error) {
      this.logger.error(
        `Failed to send password reset notification to ${email}`,
        error,
      );
    }
  }
  
  private configServiceUrl(): string {
    return this.configService.getOrThrow<string>('NOTIFICATION_SERVICE_URL');
  }
  
  private internalHeaders() {
    return {
      'x-internal-api-key':
        this.configService.getOrThrow<string>('INTERNAL_API_KEY'),
    };
  }

  private invalidCredentialsException(): RpcException {
    return new RpcException({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
  }

  private invalidRefreshTokenException(): RpcException {
    return new RpcException({
      statusCode: 401,
      code: 'INVALID_REFRESH_TOKEN',
      message: 'Invalid refresh token',
    });
  }
}