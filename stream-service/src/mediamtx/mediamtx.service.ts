import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MediamtxService {
  private readonly logger = new Logger(MediamtxService.name);
  private readonly apiUrl: string;
  private readonly apiUser?: string;
  private readonly apiPassword?: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl =
      this.configService.get<string>('MEDIAMTX_API_URL') ??
      'http://camera-mediamtx:9997';

    this.apiUser = this.configService.get<string>('MEDIAMTX_API_USER');
    this.apiPassword = this.configService.get<string>('MEDIAMTX_API_PASSWORD');
  }

  async ensureRtspPath(path: string, rtspUrl: string): Promise<void> {
    const body = {
      source: rtspUrl,
      sourceOnDemand: true,
    };

    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/v3/config/paths/add/${encodeURIComponent(path)}`,
          body,
          this.requestConfig(),
        ),
      );

      return;
    } catch (error) {
      const err = error as any;

      /**
       * Если path уже существует, пробуем обновить.
       */
      if (err?.response?.status !== 400 && err?.response?.status !== 409) {
        this.logger.error(
          `Failed to add MediaMTX path ${path}`,
          err?.response?.data ?? err?.message,
        );
      }
    }

    try {
      await firstValueFrom(
        this.httpService.patch(
          `${this.apiUrl}/v3/config/paths/patch/${encodeURIComponent(path)}`,
          body,
          this.requestConfig(),
        ),
      );
    } catch (error) {
      const err = error as any;

      this.logger.error(
        `Failed to patch MediaMTX path ${path}`,
        err?.response?.data ?? err?.message,
      );

      throw error;
    }
  }

  async getPathStatus(path: string): Promise<unknown | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.apiUrl}/v3/paths/get/${encodeURIComponent(path)}`,
          this.requestConfig(),
        ),
      );

      return response.data;
    } catch {
      return null;
    }
  }

  private requestConfig() {
    if (!this.apiUser || !this.apiPassword) {
      return {};
    }

    return {
      auth: {
        username: this.apiUser,
        password: this.apiPassword,
      },
    };
  }
}