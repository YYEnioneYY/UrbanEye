import { ApiProperty } from '@nestjs/swagger';

class ProcessStatusDto {
  @ApiProperty({ example: 1 })
  pid!: number;

  @ApiProperty({ example: 'v20.20.2' })
  nodeVersion!: string;

  @ApiProperty({ example: 'linux' })
  platform!: string;

  @ApiProperty({ example: 'x64' })
  arch!: string;

  @ApiProperty({ example: 'production' })
  environment!: string;
}

class MemoryStatusDto {
  @ApiProperty({ example: 128.42 })
  rssMb!: number;

  @ApiProperty({ example: 64.12 })
  heapTotalMb!: number;

  @ApiProperty({ example: 42.55 })
  heapUsedMb!: number;

  @ApiProperty({ example: 3.12 })
  externalMb!: number;

  @ApiProperty({ example: 0.44 })
  arrayBuffersMb!: number;
}

class CpuStatusDto {
  @ApiProperty({ example: 1200000 })
  userMicroseconds!: number;

  @ApiProperty({ example: 300000 })
  systemMicroseconds!: number;
}

class LoadAverageDto {
  @ApiProperty({ example: 0.12 })
  oneMinute!: number;

  @ApiProperty({ example: 0.2 })
  fiveMinutes!: number;

  @ApiProperty({ example: 0.18 })
  fifteenMinutes!: number;
}

class SystemStatusDto {
  @ApiProperty({ example: 8 })
  cpuCount!: number;

  @ApiProperty({ type: LoadAverageDto })
  loadAverage!: LoadAverageDto;

  @ApiProperty({ example: 16384 })
  totalMemoryMb!: number;

  @ApiProperty({ example: 8420 })
  freeMemoryMb!: number;
}

class EventLoopStatusDto {
  @ApiProperty({ example: 4.2 })
  meanDelayMs!: number;

  @ApiProperty({ example: 12.4 })
  maxDelayMs!: number;
}

export class ApiGatewayStatusDto {
  @ApiProperty({ example: 'api-gateway' })
  service!: string;

  @ApiProperty({ example: 'ok' })
  status!: 'ok';

  @ApiProperty({ example: '2026-05-27T18:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 3600 })
  uptimeSeconds!: number;

  @ApiProperty({ type: ProcessStatusDto })
  process!: ProcessStatusDto;

  @ApiProperty({ type: MemoryStatusDto })
  memory!: MemoryStatusDto;

  @ApiProperty({ type: CpuStatusDto })
  cpu!: CpuStatusDto;

  @ApiProperty({ type: SystemStatusDto })
  system!: SystemStatusDto;

  @ApiProperty({ type: EventLoopStatusDto })
  eventLoop!: EventLoopStatusDto;
}