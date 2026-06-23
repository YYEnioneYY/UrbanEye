import { Injectable } from '@nestjs/common';
import { CameraEvent as CameraEventModel, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { S3StorageService } from '../s3-storage/s3-storage.service';
import { CameraEventsGateway } from './camera-events.gateway';
import { NormalizedCameraEvent, RawExternalCameraEvent } from './types';

@Injectable()
export class CameraEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3StorageService: S3StorageService,
    private readonly cameraEventsGateway: CameraEventsGateway,
  ) {}

  async handleRawEvent(params: {
    cameraId: string;
    intersectionId: string | null;
    raw: RawExternalCameraEvent;
  }) {
    const imageUrl = await this.resolveImageUrl(params.cameraId, params.raw);

    const eventType =
      params.raw.type ??
      params.raw.eventType ??
      params.raw.event ??
      'unknown';

    const occurredAtRaw =
      params.raw.occurredAt ?? params.raw.timestamp ?? params.raw.time;

    const occurredAt = occurredAtRaw ? new Date(occurredAtRaw) : new Date();

    const created = await this.prisma.cameraEvent.create({
      data: {
        cameraId: params.cameraId,
        intersectionId: params.intersectionId,
        eventType,
        title: params.raw.title ?? this.createDefaultTitle(eventType),
        description: params.raw.description ?? null,
        imageUrl,
        confidence:
          typeof params.raw.confidence === 'number'
            ? params.raw.confidence
            : null,
        metadata: (params.raw.metadata ?? {}) as Prisma.InputJsonValue,
        rawPayload: params.raw as Prisma.InputJsonValue,
        occurredAt,
      },
    });

    const normalized = this.mapEvent(created);

    this.cameraEventsGateway.emitCameraEvent(normalized);

    return normalized;
  }

  async findLatestByCamera(cameraId: string, limit: number) {
    const events = await this.prisma.cameraEvent.findMany({
      where: {
        cameraId,
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: limit,
    });

    return events.map((event) => this.mapEvent(event));
  }

  async findLatestByIntersection(intersectionId: string, limit: number) {
    const events = await this.prisma.cameraEvent.findMany({
      where: {
        intersectionId,
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: limit,
    });

    return events.map((event) => this.mapEvent(event));
  }

  private async resolveImageUrl(
    cameraId: string,
    raw: RawExternalCameraEvent,
  ): Promise<string | null> {
    if (raw.imageUrl && typeof raw.imageUrl === 'string') {
      return raw.imageUrl;
    }

    if (!raw.imageBase64 || typeof raw.imageBase64 !== 'string') {
      return null;
    }

    const cleanedBase64 = raw.imageBase64.replace(
      /^data:image\/\w+;base64,/,
      '',
    );

    const buffer = Buffer.from(cleanedBase64, 'base64');

    const uploaded = await this.s3StorageService.uploadEventImage({
      cameraId,
      buffer,
      contentType: 'image/jpeg',
      extension: 'jpg',
    });

    return uploaded.url;
  }

  private createDefaultTitle(eventType: string) {
    if (eventType === 'vehicle_arrived') {
      return 'Автомобиль подъехал';
    }

    if (eventType === 'motion_detected') {
      return 'Обнаружено движение';
    }

    return 'Событие камеры';
  }

  private mapEvent(event: CameraEventModel): NormalizedCameraEvent {
    return {
      id: event.id,
      type: event.eventType,
      cameraId: event.cameraId,
      intersectionId: event.intersectionId,
      title: event.title,
      description: event.description,
      imageUrl: event.imageUrl,
      confidence: event.confidence,
      metadata: event.metadata as Record<string, unknown>,
      occurredAt: event.occurredAt,
      createdAt: event.createdAt,
    };
  }
}