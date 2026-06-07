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

    const expectedApiKey = this.configService.get<string>('INTERNAL_API_KEY');

    if (!expectedApiKey) {
      throw new UnauthorizedException('Internal API key is not configured');
    }

    const apiKey = request.headers['x-internal-api-key'];

    if (apiKey !== expectedApiKey) {
      throw new UnauthorizedException('Invalid internal API key');
    }

    return true;
  }
}