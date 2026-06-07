import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CameraHttpClientService } from '../camera-http-client/camera-http-client.service';
import { MediamtxService } from '../mediamtx/mediamtx.service';

@Injectable()
export class StreamsService {
  constructor(
    private readonly cameraHttpClientService: CameraHttpClientService,
    private readonly mediamtxService: MediamtxService,
    private readonly configService: ConfigService,
  ) {}

  async getByCameraId(cameraId: string) {
    const cameraData =
      await this.cameraHttpClientService.getConnectionByCameraId(cameraId);

    const path = cameraData.streamPath;

    const rtspUrl = this.buildRtspUrlWithCredentials(
      cameraData.connection.rtspUrl,
      cameraData.connection.username,
      cameraData.connection.password,
    );

    await this.mediamtxService.ensureRtspPath(path, rtspUrl);

    return {
      camera: cameraData.camera,
      stream: {
        type: 'webrtc' as const,
        path,
        playerUrl: this.buildPlayerUrl(path),
        whepUrl: this.buildWhepUrl(path),
      },
    };
  }

  async getStatusByCameraId(cameraId: string) {
    const cameraData =
      await this.cameraHttpClientService.getConnectionByCameraId(cameraId);

    const path = cameraData.streamPath;

    const mediaServerPath = await this.mediamtxService.getPathStatus(path);

    return {
      cameraId,
      path,
      configured: Boolean(mediaServerPath),
      online: this.isPathOnline(mediaServerPath),
      mediaServerPath,
    };
  }

  private buildPlayerUrl(path: string): string {
    const publicUrl = this.getWebrtcPublicUrl();

    return `${publicUrl}/${path}`;
  }

  private buildWhepUrl(path: string): string {
    const publicUrl = this.getWebrtcPublicUrl();

    return `${publicUrl}/${path}/whep`;
  }

  private getWebrtcPublicUrl(): string {
    return (
      this.configService.get<string>('MEDIAMTX_WEBRTC_PUBLIC_URL') ??
      'http://localhost:8889'
    ).replace(/\/+$/, '');
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

  private isPathOnline(mediaServerPath: unknown | null): boolean {
    if (!mediaServerPath || typeof mediaServerPath !== 'object') {
      return false;
    }

    const path = mediaServerPath as any;

    return Boolean(
      path.ready === true ||
        path.sourceReady === true ||
        path.tracks?.length > 0 ||
        path.bytesReceived > 0,
    );
  }
}