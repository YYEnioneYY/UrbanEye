import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export type HealthCheckTarget = {
  cameraId: string;
  title: string;
  slug: string;
  status: string;
  connection: {
    rtspUrl: string;
    username: string | null;
    password: string | null;
  };
};

export type CameraHealthStatus = 'unknown' | 'online' | 'offline' | 'unstable';

export type UpdateCameraHealthPayload = {
  healthStatus: CameraHealthStatus;
  videoCodec: string | null;
  audioCodec: string | null;
  transcodingRequired: boolean;
  healthError: string | null;
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

  async getHealthCheckTargets(limit: number): Promise<HealthCheckTarget[]> {
    const url = `${this.cameraServiceUrl}/internal/cameras/health-check-targets`;

    const response = await firstValueFrom(
      this.httpService.get<HealthCheckTarget[]>(url, {
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

  async updateCameraHealth(
    cameraId: string,
    payload: UpdateCameraHealthPayload,
  ) {
    const url = `${this.cameraServiceUrl}/internal/cameras/${cameraId}/health`;

    try {
      await firstValueFrom(
        this.httpService.patch(url, payload, {
          headers: {
            'x-internal-api-key': this.internalApiKey,
          },
          timeout: 10000,
        }),
      );
    } catch (error) {
      const err = error as any;

      this.logger.error('Failed to update camera health', {
        cameraId,
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
    }
  }
}