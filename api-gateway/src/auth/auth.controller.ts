import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PublicAuthResponse } from './types/auth-response.type';

type RequestWithCookies = Request & {
  cookies?: Record<string, string>;
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация пользователя' })
  @ApiCreatedResponse({ description: 'Пользователь зарегистрирован' })
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PublicAuthResponse> {
    const authResponse = await this.authService.register(dto, {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    });

    this.setRefreshCookie(response, authResponse.refreshToken);

    return {
      user: authResponse.user,
      accessToken: authResponse.accessToken,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Вход в аккаунт' })
  @ApiOkResponse({ description: 'Пользователь вошёл в аккаунт' })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PublicAuthResponse> {
    const authResponse = await this.authService.login(dto, {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    });

    this.setRefreshCookie(response, authResponse.refreshToken);

    return {
      user: authResponse.user,
      accessToken: authResponse.accessToken,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refresh-token')
  @ApiOperation({ summary: 'Обновление access token через refresh token' })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PublicAuthResponse> {
    const refreshToken = dto.refreshToken ?? request.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const authResponse = await this.authService.refresh(refreshToken, {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    });

    this.setRefreshCookie(response, authResponse.refreshToken);

    return {
      user: authResponse.user,
      accessToken: authResponse.accessToken,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refresh-token')
  @ApiOperation({ summary: 'Выход из аккаунта' })
  async logout(
    @Body() dto: LogoutDto,
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = dto.refreshToken ?? request.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const result = await this.authService.logout(refreshToken);

    this.clearRefreshCookie(response);

    return result;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Запрос сброса пароля' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Сброс пароля по токену из письма' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  private setRefreshCookie(response: Response, refreshToken: string) {
    const refreshTtlSeconds = Number(
      this.configService.get('JWT_REFRESH_TTL_SECONDS') ?? 60 * 60 * 24 * 30,
    );

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: refreshTtlSeconds * 1000,
      path: '/',
    });
  }

  private clearRefreshCookie(response: Response) {
    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
}