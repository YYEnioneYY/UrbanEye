import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toPublicCamera } from '../cameras/camera.mapper';
import { CamerasRepository } from '../cameras/cameras.repository';
import { MediaServerClient } from './media-server.client';

@Injectable()
export class StreamsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly camerasRepository: CamerasRepository,
    private readonly mediaServerClient: MediaServerClient,
  ) {}

  async getStreamByCameraId(cameraId: string) {
    const camera = await this.camerasRepository.findById(cameraId);

    if (!camera) {
      throw new NotFoundException(`Camera ${cameraId} not found`);
    }

    await this.mediaServerClient.registerRtspPath(camera.path, camera.rtspUrl);

    const publicWebrtcUrl = this.configService.getOrThrow<string>(
      'MEDIAMTX_WEBRTC_PUBLIC_URL',
    );

    return {
      camera: toPublicCamera(camera),
      stream: {
        type: 'webrtc',
        path: camera.path,

        // Для быстрого iframe-плеера.
        playerUrl: `${publicWebrtcUrl}/${camera.path}`,

        // Для кастомного WebRTC-плеера.
        whepUrl: `${publicWebrtcUrl}/${camera.path}/whep`,
      },
    };
  }

  async getStatusByCameraId(cameraId: string) {
    const camera = await this.camerasRepository.findById(cameraId);

    if (!camera) {
      throw new NotFoundException(`Camera ${cameraId} not found`);
    }

    const pathsList = await this.mediaServerClient.getPathsList();
    const items = pathsList.items ?? [];

    const pathInfo = items.find((item: any) => item.name === camera.path);

    return {
      cameraId: camera.id,
      path: camera.path,
      configured: Boolean(pathInfo),
      online: Boolean(pathInfo?.ready ?? pathInfo?.available ?? false),
      mediaServerPath: pathInfo ?? null,
    };
  }
}