import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type MediaMtxPathConfig = {
  source: string;
  sourceOnDemand: boolean;
  rtspTransport: 'tcp' | 'udp' | 'automatic';
};

@Injectable()
export class MediaServerClient {
  constructor(private readonly configService: ConfigService) {}

  private get apiUrl(): string {
    return this.configService.getOrThrow<string>('MEDIAMTX_API_URL');
  }

  private getAuthHeaders(): Record<string, string> {
    const username = this.configService.getOrThrow<string>('MEDIAMTX_API_USER');
    const password = this.configService.getOrThrow<string>(
      'MEDIAMTX_API_PASSWORD',
    );

    const token = Buffer.from(`${username}:${password}`).toString('base64');

    return {
      Authorization: `Basic ${token}`,
    };
  }

  async getPathsList(): Promise<any> {
    const response = await fetch(`${this.apiUrl}/v3/paths/list`, {
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new ServiceUnavailableException(
        `Media server is not available. Status: ${response.status}. Body: ${errorText}`,
      );
    }

    return response.json();
  }

  async registerRtspPath(path: string, rtspUrl: string): Promise<void> {
    const body: MediaMtxPathConfig = {
      source: rtspUrl,
      sourceOnDemand: true,
      rtspTransport: 'tcp',
    };

    const addResponse = await fetch(
      `${this.apiUrl}/v3/config/paths/add/${encodeURIComponent(path)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(body),
      },
    );

    if (addResponse.ok) {
      return;
    }

    const addErrorText = await addResponse.text();

    const replaceResponse = await fetch(
      `${this.apiUrl}/v3/config/paths/replace/${encodeURIComponent(path)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(body),
      },
    );

    if (!replaceResponse.ok) {
      const replaceErrorText = await replaceResponse.text();

      throw new InternalServerErrorException(
        [
          `Cannot register MediaMTX path "${path}".`,
          `Add status: ${addResponse.status}. Add body: ${addErrorText}`,
          `Replace status: ${replaceResponse.status}. Replace body: ${replaceErrorText}`,
        ].join(' '),
      );
    }
  }
}