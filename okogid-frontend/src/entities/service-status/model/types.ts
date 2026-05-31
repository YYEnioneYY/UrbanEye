export type ServiceStatusValue = 'ok' | 'error' | 'warning' | 'offline';

export type ServiceStatus = {
  service: string;
  status: ServiceStatusValue | string;
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