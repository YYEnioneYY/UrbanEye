import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';

@Injectable()
export class FfmpegPreviewService {
  async createSnapshot(rtspUrl: string, timeoutMs: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const args = [
        '-rtsp_transport',
        'tcp',

        '-i',
        rtspUrl,

        '-frames:v',
        '1',

        '-q:v',
        '3',

        '-f',
        'image2pipe',

        '-vcodec',
        'mjpeg',

        'pipe:1',
      ];

      const process = spawn('ffmpeg', args);

      const chunks: Buffer[] = [];
      let stderr = '';

      const timeout = setTimeout(() => {
        process.kill('SIGKILL');
        reject(new Error(`ffmpeg snapshot timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      process.stdout.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      process.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      process.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      process.on('close', (code) => {
        clearTimeout(timeout);

        if (code !== 0) {
          reject(
            new Error(
              stderr || `ffmpeg snapshot exited with code ${code}`,
            ),
          );
          return;
        }

        const buffer = Buffer.concat(chunks);

        if (buffer.length === 0) {
          reject(new Error('ffmpeg returned empty snapshot'));
          return;
        }

        resolve(buffer);
      });
    });
  }
}