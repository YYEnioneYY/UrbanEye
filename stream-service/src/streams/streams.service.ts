import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CameraHttpClientService } from '../camera-http-client/camera-http-client.service';
import { MediamtxService } from '../mediamtx/mediamtx.service';
import { TranscodingService } from '../transcoding/transcoding.service';

@Injectable()
export class StreamsService {
  constructor(
    private readonly cameraHttpClientService: CameraHttpClientService,
    private readonly mediamtxService: MediamtxService,
    private readonly transcodingService: TranscodingService,
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

    const forceTranscoding =
      this.configService.get<string>('FORCE_TRANSCODING') === 'true';
      
    const shouldTranscode =
      forceTranscoding || cameraData.camera.health?.transcodingRequired === true;

    let finalPath = path;

    if (shouldTranscode) {
      finalPath = `transcoded-${path}`;
    
      this.transcodingService.ensureTranscoding(rtspUrl, finalPath);
    } else {
      await this.mediamtxService.ensureRtspPath(path, rtspUrl);
    }

    await this.cameraHttpClientService.incrementViews(cameraId);

    const { health, ...publicCamera } = cameraData.camera;

    return {
      camera: publicCamera,
      stream: {
        type: 'webrtc' as const,
        path: finalPath,
        playerUrl: this.buildPlayerUrl(finalPath),
        whepUrl: this.buildWhepUrl(finalPath),
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