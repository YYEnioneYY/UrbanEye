import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { CamerasRepository } from './cameras.repository';
import { MediaServerClient } from './media-server.client';

@Injectable()
export class StreamsBootstrap implements OnApplicationBootstrap {
  private readonly logger = new Logger(StreamsBootstrap.name);

  constructor(
    private readonly camerasRepository: CamerasRepository,
    private readonly mediaServerClient: MediaServerClient,
  ) {}

  async onApplicationBootstrap() {
    const cameras = await this.camerasRepository.findAll();

    this.logger.log(`Found ${cameras.length} cameras in local config`);

    for (const camera of cameras) {
      await this.registerCameraWithRetry(camera.path, camera.rtspUrl);
    }
  }

  private async registerCameraWithRetry(
    path: string,
    rtspUrl: string,
    attempt = 1,
  ): Promise<void> {
    try {
      await this.mediaServerClient.registerRtspPath(path, rtspUrl);

      this.logger.log(`Registered stream path: ${path}`);
    } catch (error) {
      if (attempt >= 10) {
        this.logger.error(`Failed to register stream path: ${path}`);
        throw error;
      }

      this.logger.warn(
        `MediaMTX is not ready. Retry ${attempt}/10 for path: ${path}`,
      );

      await this.sleep(1000);

      return this.registerCameraWithRetry(path, rtspUrl, attempt + 1);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}