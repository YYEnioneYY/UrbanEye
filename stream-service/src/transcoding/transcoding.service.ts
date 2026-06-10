import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';

@Injectable()
export class TranscodingService implements OnModuleDestroy {
  private readonly logger = new Logger(TranscodingService.name);

  private readonly processes = new Map<string, ChildProcessWithoutNullStreams>();

  constructor(private readonly configService: ConfigService) {}

  ensureTranscoding(inputRtspUrl: string, outputPath: string) {
    const existingProcess = this.processes.get(outputPath);

    if (existingProcess && !existingProcess.killed) {
      return;
    }

    const mediamtxRtspUrl = (
      this.configService.get<string>('MEDIAMTX_RTSP_INTERNAL_URL') ??
      'rtsp://camera-mediamtx:8554'
    ).replace(/\/+$/, '');

    const outputRtspUrl = `${mediamtxRtspUrl}/${outputPath}`;

    const args = [
      '-rtsp_transport',
      'tcp',

      '-i',
      inputRtspUrl,

      '-an',

      '-c:v',
      'libx264',

      '-preset',
      'veryfast',

      '-tune',
      'zerolatency',

      '-profile:v',
      'baseline',

      '-pix_fmt',
      'yuv420p',

      '-f',
      'rtsp',

      outputRtspUrl,
    ];

    this.logger.log(`Starting FFmpeg transcoding: ${outputPath}`);
    this.logger.log(`FFmpeg output RTSP: ${outputRtspUrl}`);

    const process = spawn('ffmpeg', args);

    process.stderr.on('data', (data: Buffer) => {
      const message = data.toString();

      if (
        message.includes('Error') ||
        message.includes('error') ||
        message.includes('failed') ||
        message.includes('Failed') ||
        message.includes('Conversion failed')
      ) {
        this.logger.warn(`[${outputPath}] ${message}`);
      }
    });

    process.on('exit', (code) => {
      this.logger.warn(`FFmpeg exited for ${outputPath}, code=${code}`);
      this.processes.delete(outputPath);
    });

    this.processes.set(outputPath, process);
  }

  onModuleDestroy() {
    for (const process of this.processes.values()) {
      process.kill('SIGTERM');
    }

    this.processes.clear();
  }
}