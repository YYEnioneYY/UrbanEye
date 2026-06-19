import { Injectable } from '@nestjs/common';
import { KafkaClientService } from '../kafka/kafka-client.service';
import { CreateIntersectionCameraDto } from './dto/create-intersection-camera.dto';
import { CreateIntersectionDto } from './dto/create-intersection.dto';
import { FindIntersectionsBboxDto } from './dto/find-intersections-bbox.dto';
import { UpdateIntersectionDto } from './dto/update-intersection.dto';

type PublicIntersectionCamera = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: 'online' | 'offline' | 'maintenance' | 'planned';
  city: string | null;
  address: string | null;
  category: string | null;
  previewUrl: string | null;
  coordinates: {
    lat: number;
    lng: number;
  };
  coverage: {
    directionDeg: number | null;
    fovDeg: number;
    rangeMeters: number;
  };
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
};

type StreamResponse = {
  camera: unknown;
  stream: {
    type: 'webrtc';
    path: string;
    playerUrl: string;
    whepUrl: string;
  };
};

@Injectable()
export class IntersectionService {
  constructor(private readonly kafkaClientService: KafkaClientService) {}

  create(dto: CreateIntersectionDto) {
    return this.kafkaClientService.send(
      'camera.admin.intersections.create',
      dto,
    );
  }

  findAllAdmin() {
    return this.kafkaClientService.send(
      'camera.admin.intersections.find_all',
      {},
    );
  }

  findByIdAdmin(intersectionId: string) {
    return this.kafkaClientService.send(
      'camera.admin.intersections.find_by_id',
      {
        intersectionId,
      },
    );
  }

  update(intersectionId: string, dto: UpdateIntersectionDto) {
    return this.kafkaClientService.send(
      'camera.admin.intersections.update',
      {
        intersectionId,
        dto,
      },
    );
  }

  delete(intersectionId: string) {
    return this.kafkaClientService.send(
      'camera.admin.intersections.delete',
      {
        intersectionId,
      },
    );
  }

  createCamera(intersectionId: string, dto: CreateIntersectionCameraDto) {
    return this.kafkaClientService.send(
      'camera.admin.intersections.create_camera',
      {
        intersectionId,
        dto,
      },
    );
  }

  findCameras(intersectionId: string) {
    return this.kafkaClientService.send(
      'camera.admin.intersections.find_cameras',
      {
        intersectionId,
      },
    );
  }

  findByBbox(dto: FindIntersectionsBboxDto) {
    return this.kafkaClientService.send(
      'camera.public.intersections.find_by_bbox',
      dto,
    );
  }

  findById(intersectionId: string) {
    return this.kafkaClientService.send(
      'camera.public.intersections.find_by_id',
      {
        intersectionId,
      },
    );
  }

  findCamerasByIntersectionId(
    intersectionId: string,
  ): Promise<PublicIntersectionCamera[]> {
    return this.kafkaClientService.send(
      'camera.public.intersections.find_cameras_by_id',
      {
        intersectionId,
      },
    );
  }

  async findStreams(intersectionId: string) {
    const intersection = await this.findById(intersectionId);

    const cameras = await this.findCamerasByIntersectionId(intersectionId);

    const streams = await Promise.all(
      cameras.map(async (camera) => {
        if (camera.status !== 'online') {
          return {
            camera,
            stream: null,
            available: false,
            error: 'Camera is not online',
          };
        }

        try {
          const streamResponse =
            await this.kafkaClientService.send<StreamResponse>(
              'streams.get_by_camera_id',
              {
                cameraId: camera.id,
              },
            );

          return {
            camera,
            stream: streamResponse.stream,
            available: true,
            error: null,
          };
        } catch (error) {
          const err = error as Error;

          return {
            camera,
            stream: null,
            available: false,
            error: err.message,
          };
        }
      }),
    );

    return {
      intersection,
      streams,
    };
  }
}