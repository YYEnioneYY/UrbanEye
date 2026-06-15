import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';

export type ProbeResult = {
  ok: boolean;
  videoCodec: string | null;
  audioCodec: string | null;
  width: number | null;
  height: number | null;
  error: string | null;
};

type FfprobeStream = {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
};

type FfprobeJson = {
  streams?: FfprobeStream[];
};

@Injectable()
export class FfprobeService {
  async probeRtsp(rtspUrl: string, timeoutMs: number): Promise<ProbeResult> {
    return new Promise((resolve) => {
      const args = [
        '-v',
        'error',
        '-rtsp_transport',
        'tcp',
        '-show_streams',
        '-of',
        'json',
        rtspUrl,
      ];

      const process = spawn('ffprobe', args);

      let stdout = '';
      let stderr = '';

      const timeout = setTimeout(() => {
        process.kill('SIGKILL');

        resolve({
          ok: false,
          videoCodec: null,
          audioCodec: null,
          width: null,
          height: null,
          error: `ffprobe timeout after ${timeoutMs}ms`,
        });
      }, timeoutMs);

      process.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      process.on('error', (error) => {
        clearTimeout(timeout);

        resolve({
          ok: false,
          videoCodec: null,
          audioCodec: null,
          width: null,
          height: null,
          error: error.message,
        });
      });

      process.on('close', (code) => {
        clearTimeout(timeout);

        if (code !== 0) {
          resolve({
            ok: false,
            videoCodec: null,
            audioCodec: null,
            width: null,
            height: null,
            error: stderr || `ffprobe exited with code ${code}`,
          });

          return;
        }

        try {
          const parsed = JSON.parse(stdout) as FfprobeJson;

          const videoStream = parsed.streams?.find(
            (stream) => stream.codec_type === 'video',
          );

          const audioStream = parsed.streams?.find(
            (stream) => stream.codec_type === 'audio',
          );

          if (!videoStream?.codec_name) {
            resolve({
              ok: false,
              videoCodec: null,
              audioCodec: audioStream?.codec_name ?? null,
              width: null,
              height: null,
              error: 'Video stream not found',
            });

            return;
          }

          resolve({
            ok: true,
            videoCodec: videoStream.codec_name,
            audioCodec: audioStream?.codec_name ?? null,
            width: videoStream.width ?? null,
            height: videoStream.height ?? null,
            error: null,
          });
        } catch (error) {
          const err = error as Error;

          resolve({
            ok: false,
            videoCodec: null,
            audioCodec: null,
            width: null,
            height: null,
            error: err.message,
          });
        }
      });
    });
  }
}