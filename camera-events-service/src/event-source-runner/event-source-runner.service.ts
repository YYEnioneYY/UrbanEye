import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';
import type { ClientOptions } from 'ws';
import {
  CameraClientService,
  CameraEventSource,
} from '../camera-client/camera-client.service';
import { CameraEventsService } from '../events/camera-events.service';
import { RawExternalCameraEvent } from '../events/types';

type WsClientOptions = ClientOptions & {
  servername?: string;
};

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
    const target = this.createConnectTarget(source.eventWsUrl);

    this.logger.log(
      `Connecting event WS for camera ${source.cameraId}: ${target.connectUrl}`,
    );

    const ws = new WebSocket(target.connectUrl, target.options);

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

  private createConnectUrl(eventWsUrl: string) {
    const rewriteEnabled =
      this.configService.get<string>('EVENT_WS_LOCALHOST_REWRITE_ENABLED') !==
      'false';
    
    if (!rewriteEnabled) {
      return eventWsUrl;
    }
  
    try {
      const url = new URL(eventWsUrl);
    
      const localhostHosts = new Set([
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '::1',
      ]);
    
      if (!localhostHosts.has(url.hostname)) {
        return eventWsUrl;
      }
    
      const replacementHost =
        this.configService.get<string>('EVENT_WS_LOCALHOST_HOST') ??
        'host.docker.internal';
    
      url.hostname = replacementHost;
    
      return url.toString();
    } catch {
      return eventWsUrl;
    }
  }

  private createConnectTarget(eventWsUrl: string): {
    connectUrl: string;
    options: WsClientOptions;
  } {
    const rejectUnauthorized =
      this.configService.get<string>('EVENT_WS_REJECT_UNAUTHORIZED') !== 'false';
  
    const handshakeTimeout = Number(
      this.configService.get<string>('EVENT_WS_HANDSHAKE_TIMEOUT_MS') ?? 30000,
    );
  
    const options: WsClientOptions = {
      rejectUnauthorized,
      handshakeTimeout,
    };
  
    const rewriteEnabled =
      this.configService.get<string>('EVENT_WS_LOCALHOST_REWRITE_ENABLED') !==
      'false';
  
    if (!rewriteEnabled) {
      return {
        connectUrl: eventWsUrl,
        options,
      };
    }
  
    try {
      const originalUrl = new URL(eventWsUrl);
    
      const localhostHosts = new Set([
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '::1',
      ]);
    
      if (!localhostHosts.has(originalUrl.hostname)) {
        return {
          connectUrl: eventWsUrl,
          options,
        };
      }
    
      const connectUrl = new URL(eventWsUrl);
    
      const replacementHost =
        this.configService.get<string>('EVENT_WS_LOCALHOST_HOST') ??
        'host.docker.internal';
    
      connectUrl.hostname = replacementHost;
    
      options.servername = originalUrl.hostname;
    
      options.headers = {
        Host: originalUrl.host,
      };
    
      return {
        connectUrl: connectUrl.toString(),
        options,
      };
    } catch {
      return {
        connectUrl: eventWsUrl,
        options,
      };
    }
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