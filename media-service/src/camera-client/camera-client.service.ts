import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export type PreviewTarget = {
  cameraId: string;
  title: string;
  slug: string;
  connection: {
    rtspUrl: string;
    username: string | null;
    password: string | null;
  };
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

  async getPreviewTargets(limit: number): Promise<PreviewTarget[]> {
    const url = `${this.cameraServiceUrl}/internal/cameras/preview-targets`;

    const response = await firstValueFrom(
      this.httpService.get<PreviewTarget[]>(url, {
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

  async updateCameraPreview(cameraId: string, previewUrl: string) {
    const url = `${this.cameraServiceUrl}/internal/cameras/${cameraId}/preview`;

    try {
      await firstValueFrom(
        this.httpService.patch(
          url,
          {
            previewUrl,
          },
          {
            headers: {
              'x-internal-api-key': this.internalApiKey,
            },
            timeout: 10000,
          },
        ),
      );
    } catch (error) {
      const err = error as any;

      this.logger.error('Failed to update camera preview', {
        cameraId,
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
    }
  }
}