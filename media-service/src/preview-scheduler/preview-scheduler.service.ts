import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import {
  CameraClientService,
  PreviewTarget,
} from '../camera-client/camera-client.service';
import { FfmpegPreviewService } from '../ffmpeg-preview/ffmpeg-preview.service';
import { S3StorageService } from '../s3-storage/s3-storage.service';

@Injectable()
export class PreviewSchedulerService {
  private readonly logger = new Logger(PreviewSchedulerService.name);

  private isRunning = false;

  constructor(
    private readonly cameraClientService: CameraClientService,
    private readonly ffmpegPreviewService: FfmpegPreviewService,
    private readonly s3StorageService: S3StorageService,
    private readonly configService: ConfigService,
  ) {}

  //@Interval(10 * 60_000)
  @Interval(10 * 60_000)
  async runScheduledPreviewGeneration() {
    const enabled =
      this.configService.get<string>('PREVIEW_GENERATION_ENABLED') === 'true';

    if (!enabled) {
      return;
    }

    await this.runPreviewGeneration();
  }

  async runPreviewGeneration() {
    if (this.isRunning) {
      this.logger.warn('Preview generation is already running, skip');
      return;
    }

    this.isRunning = true;

    const limit = Number(
      this.configService.get<string>('PREVIEW_GENERATION_BATCH_LIMIT') ?? 20,
    );

    try {
      const targets = await this.cameraClientService.getPreviewTargets(limit);

      this.logger.log(`Generating previews for ${targets.length} camera(s)`);

      for (const target of targets) {
        await this.generateCameraPreview(target);
      }
    } catch (error) {
      const err = error as any;

      this.logger.error('Preview generation failed', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
      });
    } finally {
      this.isRunning = false;
    }
  }

  private async generateCameraPreview(target: PreviewTarget) {
    const timeoutMs = Number(
      this.configService.get<string>('PREVIEW_GENERATION_TIMEOUT_MS') ?? 15000,
    );

    const rtspUrl = this.buildRtspUrlWithCredentials(
      target.connection.rtspUrl,
      target.connection.username,
      target.connection.password,
    );

    try {
      this.logger.log(`Creating preview for ${target.slug}`);

      const snapshot = await this.ffmpegPreviewService.createSnapshot(
        rtspUrl,
        timeoutMs,
      );

      const uploaded = await this.s3StorageService.uploadCameraPreviewBuffer({
        cameraId: target.cameraId,
        buffer: snapshot,
        contentType: 'image/jpeg',
        extension: 'jpg',
      });

      await this.cameraClientService.updateCameraPreview(
        target.cameraId,
        uploaded.url,
      );

      this.logger.log(`Preview updated for ${target.slug}`);
    } catch (error) {
      const err = error as Error;

      this.logger.warn(
        `Failed to generate preview for ${target.slug}: ${err.message}`,
      );
    }
  }

  private buildRtspUrlWithCredentials(
    rtspUrl: string,
    username: string | null,
    password: string | null,
  ): string {
    if (!username && !password) {
      return rtspUrl;
    }

    const url = new URL(rtspUrl);

    if (url.username || url.password) {
      return rtspUrl;
    }

    if (username) {
      url.username = username;
    }

    if (password) {
      url.password = password;
    }

    return url.toString();
  }
}