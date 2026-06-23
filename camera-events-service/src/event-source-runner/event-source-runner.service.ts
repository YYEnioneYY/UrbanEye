import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';
import {
  CameraClientService,
  CameraEventSource,
} from '../camera-client/camera-client.service';
import { CameraEventsService } from '../events/camera-events.service';
import { RawExternalCameraEvent } from '../events/types';

type ActiveConnection = {
  ws: WebSocket;
  eventWsUrl: string;
};

@Injectable()
export class EventSourceRunnerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(EventSourceRunnerService.name);

  private readonly connections = new Map<string, ActiveConnection>();
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly cameraClientService: CameraClientService,
    private readonly cameraEventsService: CameraEventsService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.refreshSources();

    const refreshMs = Number(
      this.configService.get<string>('EVENT_SOURCES_REFRESH_MS') ?? 60000,
    );

    this.refreshTimer = setInterval(() => {
      void this.refreshSources();
    }, refreshMs);
  }

  onModuleDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    for (const connection of this.connections.values()) {
      connection.ws.close();
    }

    this.connections.clear();
  }

  private async refreshSources() {
    const limit = Number(
      this.configService.get<string>('EVENT_SOURCES_LIMIT') ?? 500,
    );

    try {
      const sources = await this.cameraClientService.getEventSources(limit);

      const activeCameraIds = new Set(sources.map((source) => source.cameraId));

      for (const [cameraId, connection] of this.connections.entries()) {
        if (!activeCameraIds.has(cameraId)) {
          this.logger.log(`Closing event WS for camera ${cameraId}`);
          connection.ws.close();
          this.connections.delete(cameraId);
        }
      }

      for (const source of sources) {
        const current = this.connections.get(source.cameraId);

        if (!current) {
          this.connectSource(source);
          continue;
        }

        if (current.eventWsUrl !== source.eventWsUrl) {
          this.logger.log(`Reconnecting changed event WS for ${source.cameraId}`);
          current.ws.close();
          this.connections.delete(source.cameraId);
          this.connectSource(source);
        }
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to refresh event sources: ${err.message}`);
    }
  }

  private connectSource(source: CameraEventSource) {
    this.logger.log(
      `Connecting event WS for camera ${source.cameraId}: ${source.eventWsUrl}`,
    );

    const ws = new WebSocket(source.eventWsUrl);

    this.connections.set(source.cameraId, {
      ws,
      eventWsUrl: source.eventWsUrl,
    });

    ws.on('open', () => {
      this.logger.log(`Event WS connected for camera ${source.cameraId}`);
    });

    ws.on('message', (data) => {
      void this.handleMessage(source, data.toString());
    });

    ws.on('close', () => {
      this.logger.warn(`Event WS closed for camera ${source.cameraId}`);
      this.connections.delete(source.cameraId);
    });

    ws.on('error', (error) => {
      this.logger.warn(
        `Event WS error for camera ${source.cameraId}: ${error.message}`,
      );
    });
  }

  private async handleMessage(source: CameraEventSource, message: string) {
    try {
      const raw = JSON.parse(message) as RawExternalCameraEvent;

      await this.cameraEventsService.handleRawEvent({
        cameraId: source.cameraId,
        intersectionId: source.intersectionId,
        raw,
      });
    } catch (error) {
      const err = error as Error;

      this.logger.warn(
        `Failed to process event for camera ${source.cameraId}: ${err.message}`,
      );
    }
  }
}