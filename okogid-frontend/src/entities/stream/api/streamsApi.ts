import {
  mapCameraFromApi,
  type ApiCamera,
} from '../../camera/api/cameraMapper';
import { API_CONFIG, createApiUrl } from '../../../shared/config/api';
import type { CameraStreamResponse } from '../model/types';

type ApiCameraStreamResponse = {
  camera: ApiCamera;
  stream: {
    type: 'webrtc' | string;
    path: string;
    playerUrl: string;
    whepUrl: string;
  };
};

async function getApiErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as {
      message?: string | string[];
      error?: string;
    };

    if (Array.isArray(data.message)) {
      return data.message.join(', ');
    }

    if (typeof data.message === 'string') {
      return data.message;
    }

    if (typeof data.error === 'string') {
      return data.error;
    }

    return `Ошибка запроса: ${response.status}`;
  } catch {
    return `Ошибка запроса: ${response.status}`;
  }
}

export async function getCameraStreamByCameraId(
  cameraId: string,
  signal?: AbortSignal,
): Promise<CameraStreamResponse> {
  const response = await fetch(
    createApiUrl(API_CONFIG.apiBaseUrl, `/streams/cameras/${cameraId}`),
    {
      method: 'GET',
      signal,
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  const data = (await response.json()) as ApiCameraStreamResponse;

  return {
    camera: mapCameraFromApi(data.camera),
    stream: data.stream,
  };
}