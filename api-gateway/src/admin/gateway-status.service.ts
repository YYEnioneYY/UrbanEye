import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import * as os from 'node:os';

export type GatewayStatusResponse = {
  service: string;
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
  process: {
    pid: number;
    nodeVersion: string;
    platform: string;
    arch: string;
    environment: string;
  };
  memory: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
    externalMb: number;
    arrayBuffersMb: number;
  };
  cpu: {
    userMicroseconds: number;
    systemMicroseconds: number;
  };
  system: {
    cpuCount: number;
    loadAverage: {
      oneMinute: number;
      fiveMinutes: number;
      fifteenMinutes: number;
    };
    totalMemoryMb: number;
    freeMemoryMb: number;
  };
  eventLoop: {
    meanDelayMs: number;
    maxDelayMs: number;
  };
};

@Injectable()
export class GatewayStatusService implements OnModuleInit, OnModuleDestroy {
  private readonly eventLoopDelay = monitorEventLoopDelay({
    resolution: 20,
  });

  onModuleInit() {
    this.eventLoopDelay.enable();
  }

  onModuleDestroy() {
    this.eventLoopDelay.disable();
  }

  getStatus(): GatewayStatusResponse {
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage();
    const loadAverage = os.loadavg();

    return {
      service: 'api-gateway',
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),

      process: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        environment: process.env.NODE_ENV ?? 'development',
      },

      memory: {
        rssMb: this.bytesToMb(memory.rss),
        heapTotalMb: this.bytesToMb(memory.heapTotal),
        heapUsedMb: this.bytesToMb(memory.heapUsed),
        externalMb: this.bytesToMb(memory.external),
        arrayBuffersMb: this.bytesToMb(memory.arrayBuffers),
      },

      cpu: {
        userMicroseconds: cpu.user,
        systemMicroseconds: cpu.system,
      },

      system: {
        cpuCount: os.cpus().length,
        loadAverage: {
          oneMinute: loadAverage[0],
          fiveMinutes: loadAverage[1],
          fifteenMinutes: loadAverage[2],
        },
        totalMemoryMb: this.bytesToMb(os.totalmem()),
        freeMemoryMb: this.bytesToMb(os.freemem()),
      },

      eventLoop: {
        meanDelayMs: this.nanoToMs(this.eventLoopDelay.mean),
        maxDelayMs: this.nanoToMs(this.eventLoopDelay.max),
      },
    };
  }

  private bytesToMb(bytes: number): number {
    return Math.round((bytes / 1024 / 1024) * 100) / 100;
  }

  private nanoToMs(nanoseconds: number): number {
    if (!Number.isFinite(nanoseconds)) {
      return 0;
    }

    return Math.round((nanoseconds / 1_000_000) * 100) / 100;
  }
}