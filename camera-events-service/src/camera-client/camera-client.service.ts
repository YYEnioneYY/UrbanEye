import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export type CameraEventSource = {
  cameraId: string;
  intersectionId: string | null;
  title: string;
  slug: string;
  eventWsUrl: string;
};

@Injectable()
export class CameraClientService {
  private readonly logger = new Logger(CameraClientService.name);

  private readonly cameraServiceUrl: string;
  private readonly internalApiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.cameraServiceUrl = (
      this.configService.get<string>('CAMERA_SERVICE_INTERNAL_URL') ??
      'http://camera-service:3000'
    ).replace(/\/+$/, '');

    this.internalApiKey =
      this.configService.getOrThrow<string>('INTERNAL_API_KEY');
  }

  async getEventSources(limit: number): Promise<CameraEventSource[]> {
    const url = `${this.cameraServiceUrl}/internal/cameras/event-sources`;

    const response = await firstValueFrom(
      this.httpService.get<CameraEventSource[]>(url, {
        params: {
          limit,
        },
        headers: {
          'x-internal-api-key': this.internalApiKey,
        },
        timeout: 10000,
      }),
    );

    return response.data;
  }
}