import { BadGatewayException, Injectable } from '@nestjs/common';
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

  async uploadEventImage(params: {
    cameraId: string;
    buffer: Buffer;
    contentType: string;
    extension: string;
  }) {
    const key = `events/${params.cameraId}/${randomUUID()}.${params.extension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: params.buffer,
          ContentType: params.contentType,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );

      return {
        key,
        url: `${this.publicBaseUrl}/${key}`,
      };
    } catch (error) {
      const err = error as any;

      throw new BadGatewayException({
        code: 'EVENT_IMAGE_UPLOAD_FAILED',
        message: err?.message ?? 'Failed to upload event image',
      });
    }
  }
}