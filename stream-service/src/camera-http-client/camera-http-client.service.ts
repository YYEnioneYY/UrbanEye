import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

export type CameraStatus = 'online' | 'offline' | 'maintenance' | 'planned';

export type InternalCameraConnectionResponse = {
  camera: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    status: CameraStatus;
    city: string | null;
    address: string | null;
    category: string | null;
    previewUrl: string | null;
    coordinates: {
      lat: number;
      lng: number;
    };
    coverage: {
      directionDeg: number | null;
      fovDeg: number;
      rangeMeters: number;
    };
    viewsCount: number;
    health: {
      status: 'unknown' | 'online' | 'offline' | 'unstable';
      videoCodec: string | null;
      audioCodec: string | null;
      transcodingRequired: boolean;
      lastCheckedAt: string | null;
      lastOnlineAt: string | null;
      lastOfflineAt: string | null;
    };
    createdAt: string;
    updatedAt: string;
  };
  streamPath: string;
  connection: {
    rtspUrl: string;
    username: string | null;
    password: string | null;
  };
};

@Injectable()
export class CameraHttpClientService {
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

  async getConnectionByCameraId(
    cameraId: string,
  ): Promise<InternalCameraConnectionResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<InternalCameraConnectionResponse>(
          `${this.cameraServiceUrl}/internal/cameras/${cameraId}/connection`,
          {
            headers: {
              'x-internal-api-key': this.internalApiKey,
            },
            timeout: 5000,
          },
        ),
      );

      return response.data;
    } catch (error) {
      const err = error as any;

      console.error('[stream-service] camera-service HTTP error:', {
        URL,
        code: err?.code,
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
    
      throw new RpcException({
        statusCode: err?.response?.status ?? 502,
        code: err?.response?.data?.code ?? 'CAMERA_SERVICE_HTTP_ERROR',
        message:
          err?.response?.data?.message ??
          err?.message ??
          'Camera service unavailable',
      });
    }
  }

  async incrementViews(cameraId: string): Promise<void> {
    const url = `${this.cameraServiceUrl}/internal/cameras/${cameraId}/views`;

    try {
      await firstValueFrom(
        this.httpService.post(
          url,
          {},
          {
            headers: {
              'x-internal-api-key': this.internalApiKey,
            },
            timeout: 5000,
          },
        ),
      );
    } catch (error) {
      const err = error as any;

      console.error('[stream-service] increment camera views failed:', {
        url,
        code: err?.code,
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
    }
  }
}