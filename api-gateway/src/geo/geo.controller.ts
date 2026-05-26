import { Controller, Get, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { GeoResponseDto } from './dto/geo-response.dto';
import { GeoService } from './geo.service';

@ApiTags('Geo')
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('me')
  @ApiOperation({ summary: 'Получить геолокацию пользователя по IP' })
  @ApiOkResponse({ type: GeoResponseDto })
  getMe(@Req() request: Request) {
    const ip = this.getClientIp(request);

    return this.geoService.getMe(ip);
  }

  private getClientIp(request: Request): string {
    const cfIp = this.getHeaderValue(request.headers['cf-connecting-ip']);
    if (cfIp) {
      return this.normalizeIp(cfIp);
    }
  
    const realIp = this.getHeaderValue(request.headers['x-real-ip']);
    if (realIp) {
      return this.normalizeIp(realIp);
    }
  
    const forwardedFor = this.getHeaderValue(request.headers['x-forwarded-for']);
    if (forwardedFor) {
      return this.normalizeIp(forwardedFor.split(',')[0].trim());
    }
  
    return this.normalizeIp(
      request.ip ?? request.socket.remoteAddress ?? '127.0.0.1',
    );
  }
  
  private getHeaderValue(value: string | string[] | undefined): string | null {
    if (Array.isArray(value)) {
      return value[0]?.trim() || null;
    }
  
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  
    return null;
  }
  
  private normalizeIp(ip: string): string {
    if (ip.startsWith('::ffff:')) {
      return ip.replace('::ffff:', '');
    }
  
    if (ip === '::1') {
      return '127.0.0.1';
    }
  
    return ip;
  }
}