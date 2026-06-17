import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

@Injectable()
export class S3StorageService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.getOrThrow<string>('S3_BUCKET');

    this.publicBaseUrl = this.configService
      .getOrThrow<string>('S3_PUBLIC_BASE_URL')
      .replace(/\/+$/, '');

    this.s3Client = new S3Client({
      region: this.configService.get<string>('S3_REGION') ?? 'us-east-1',
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      forcePathStyle:
        this.configService.get<string>('S3_FORCE_PATH_STYLE') === 'true',
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('S3_ACCESS_KEY'),
        secretAccessKey:
          this.configService.getOrThrow<string>('S3_SECRET_KEY'),
      },
    });
  }

  async uploadCameraPreviewFile(params: {
    cameraId: string;
    file: Express.Multer.File;
  }) {
    const { cameraId, file } = params;

    if (!file) {
      throw new BadRequestException('Preview image file is required');
    }

    const extension = this.getExtensionByMimeType(file.mimetype);

    return this.uploadCameraPreviewBuffer({
      cameraId,
      buffer: file.buffer,
      contentType: file.mimetype,
      extension,
    });
  }

  async uploadCameraPreviewBuffer(params: {
    cameraId: string;
    buffer: Buffer;
    contentType: string;
    extension: string;
  }) {
    const { cameraId, buffer, contentType, extension } = params;

    const key = `cameras/${cameraId}/preview-${randomUUID()}.${extension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );

      return {
        key,
        url: `${this.publicBaseUrl}/${key}`,
      };
    } catch (error) {
      const err = error as any;

      console.error('[media-service] S3 upload failed:', {
        name: err?.name,
        message: err?.message,
        code: err?.Code ?? err?.code,
        bucket: this.bucket,
        key,
      });

      throw new BadGatewayException({
        code: 'S3_UPLOAD_FAILED',
        message: err?.message ?? 'Failed to upload file to S3',
      });
    }
  }

  private getExtensionByMimeType(mimeType: string): string {
    if (mimeType === 'image/jpeg') {
      return 'jpg';
    }

    if (mimeType === 'image/png') {
      return 'png';
    }

    if (mimeType === 'image/webp') {
      return 'webp';
    }

    throw new BadRequestException(
      'Only jpeg, png and webp images are allowed',
    );
  }
}