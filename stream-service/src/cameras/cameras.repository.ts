import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';
import { CameraConfig } from './camera.types';

@Injectable()
export class CamerasRepository {
  constructor(private readonly configService: ConfigService) {}

  async findAll(): Promise<CameraConfig[]> {
    const filePath = this.configService.getOrThrow<string>(
      'CAMERAS_CONFIG_PATH',
    );

    try {
      const raw = await readFile(filePath, 'utf-8');
      const cameras = JSON.parse(raw) as CameraConfig[];

      return cameras.filter((camera) => camera.enabled !== false);
    } catch (error) {
      throw new InternalServerErrorException(
        `Cannot read cameras config file: ${filePath}`,
      );
    }
  }

  async findById(cameraId: string): Promise<CameraConfig | null> {
    const cameras = await this.findAll();

    return cameras.find((camera) => camera.id === cameraId) ?? null;
  }
}