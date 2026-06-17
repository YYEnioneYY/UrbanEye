import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import { firstValueFrom } from 'rxjs';

export type UploadedCameraPreview = {
  key: string;
  url: string;
};

@Injectable()
export class MediaClientService {
  private readonly mediaServiceUrl: string;
  private readonly internalApiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.mediaServiceUrl = (
      this.configService.get<string>('MEDIA_SERVICE_INTERNAL_URL') ??
      'http://media-service:3000'
    ).replace(/\/+$/, '');

    this.internalApiKey =
      this.configService.getOrThrow<string>('INTERNAL_API_KEY');
  }

  async uploadCameraPreview(params: {
    cameraId: string;
    file: Express.Multer.File;
  }): Promise<UploadedCameraPreview> {
    const { cameraId, file } = params;

    const formData = new FormData();

    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const url = `${this.mediaServiceUrl}/internal/media/camera-previews/${cameraId}/upload`;

    try {
      const response = await firstValueFrom(
        this.httpService.post<UploadedCameraPreview>(url, formData, {
          headers: {
            ...formData.getHeaders(),
            'x-internal-api-key': this.internalApiKey,
          },
          maxBodyLength: Infinity,
          timeout: 15000,
        }),
      );

      return response.data;
    } catch (error) {
      const err = error as any;

      console.error('[api-gateway] media-service upload failed:', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });

      throw new BadGatewayException({
        code: 'MEDIA_SERVICE_UPLOAD_FAILED',
        message:
          err?.response?.data?.message ??
          err?.message ??
          'Failed to upload camera preview',
      });
    }
  }
}