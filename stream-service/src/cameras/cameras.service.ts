import { Injectable, NotFoundException } from '@nestjs/common';
import { toPublicCamera } from './camera.mapper';
import { CamerasRepository } from './cameras.repository';
import { PublicCamera } from './camera.types';

@Injectable()
export class CamerasService {
  constructor(private readonly camerasRepository: CamerasRepository) {}

  async findAll(): Promise<PublicCamera[]> {
    const cameras = await this.camerasRepository.findAll();

    return cameras.map(toPublicCamera);
  }

  async findById(cameraId: string): Promise<PublicCamera> {
    const camera = await this.camerasRepository.findById(cameraId);

    if (!camera) {
      throw new NotFoundException(`Camera ${cameraId} not found`);
    }

    return toPublicCamera(camera);
  }
}