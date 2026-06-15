import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { CameraClientService, HealthCheckTarget } from '../camera-client/camera-client.service';
import { FfprobeService } from '../ffprobe/ffprobe.service';

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);

  private isRunning = false;

  constructor(
    private readonly cameraClientService: CameraClientService,
    private readonly ffprobeService: FfprobeService,
    private readonly configService: ConfigService,
  ) {}

  @Interval(60_000)
  async runScheduledCheck() {
    const enabled =
      this.configService.get<string>('HEALTH_CHECK_ENABLED') !== 'false';

    if (!enabled) {
      return;
    }

    await this.runCheck();
  }

  async runCheck() {
    if (this.isRunning) {
      this.logger.warn('Health check is already running, skip');
      return;
    }

    this.isRunning = true;

    const limit = Number(
      this.configService.get<string>('HEALTH_CHECK_BATCH_LIMIT') ?? 50,
    );

    const timeoutMs = Number(
      this.configService.get<string>('HEALTH_CHECK_TIMEOUT_MS') ?? 10000,
    );

    try {
      const cameras =
        await this.cameraClientService.getHealthCheckTargets(limit);

      this.logger.log(`Checking ${cameras.length} camera(s)`);

      for (const camera of cameras) {
        await this.checkCamera(camera, timeoutMs);
      }
    } catch (error) {
      const err = error as any;

      this.logger.error('Health check failed', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
      });
    } finally {
      this.isRunning = false;
    }
  }

  private async checkCamera(camera: HealthCheckTarget, timeoutMs: number) {
    const rtspUrl = this.buildRtspUrlWithCredentials(
      camera.connection.rtspUrl,
      camera.connection.username,
      camera.connection.password,
    );

    this.logger.log(`Checking camera: ${camera.title} (${camera.cameraId})`);

    const probe = await this.ffprobeService.probeRtsp(rtspUrl, timeoutMs);

    const videoCodec = probe.videoCodec;
    const audioCodec = probe.audioCodec;

    const transcodingRequired = this.isTranscodingRequired(videoCodec);

    await this.cameraClientService.updateCameraHealth(camera.cameraId, {
      healthStatus: probe.ok ? 'online' : 'offline',
      videoCodec,
      audioCodec,
      transcodingRequired,
      healthError: probe.error,
    });

    if (probe.ok) {
      this.logger.log(
        `Camera online: ${camera.slug}, video=${videoCodec}, transcode=${transcodingRequired}`,
      );
    } else {
      this.logger.warn(`Camera offline: ${camera.slug}, error=${probe.error}`);
    }
  }

  private isTranscodingRequired(videoCodec: string | null): boolean {
    if (!videoCodec) {
      return false;
    }

    const normalizedCodec = videoCodec.toLowerCase();

    return (
      normalizedCodec === 'hevc' ||
      normalizedCodec === 'h265' ||
      normalizedCodec === 'h.265'
    );
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