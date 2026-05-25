import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const expectedApiKey =
      this.configService.getOrThrow<string>('INTERNAL_API_KEY');

    const apiKey = request.headers['x-internal-api-key'];

    if (apiKey !== expectedApiKey) {
      throw new UnauthorizedException('Invalid internal API key');
    }

    return true;
  }
}