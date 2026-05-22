import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaServerClient } from './media-server.client';
import { CamerasRepository } from './cameras.repository';

@Injectable()
export class StreamsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mediaServerClient: MediaServerClient,
    private readonly camerasRepository: CamerasRepository,
  ) {}

  async getStream(cameraId: string) {
    const camera = await this.camerasRepository.findById(cameraId);

    if (!camera) {
      throw new NotFoundException(`Camera ${cameraId} not found`);
    }

    const publicWebrtcUrl = this.configService.getOrThrow<string>(
      'MEDIAMTX_WEBRTC_PUBLIC_URL',
    );

    return {
      cameraId: camera.id,
      title: camera.title,
      path: camera.path,
      playerUrl: `${publicWebrtcUrl}/${camera.path}`,
      whepUrl: `${publicWebrtcUrl}/${camera.path}/whep`,
      type: 'webrtc',
    };
  }

  async getStatus(cameraId: string) {
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
      configured: true,
      online: Boolean(pathInfo?.ready ?? pathInfo?.available ?? pathInfo?.online),
      mediaServerPath: pathInfo ?? null,
    };
  }
}