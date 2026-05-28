import { API_CONFIG, createApiUrl } from '../../../shared/config/api';
import type { Camera } from '../model/types';
import { mapCameraFromApi, type ApiCamera } from './cameraMapper';

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

export async function getCameras(signal?: AbortSignal): Promise<Camera[]> {
  const response = await fetch(createApiUrl(API_CONFIG.apiBaseUrl, '/cameras'), {
    method: 'GET',
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  const data = (await response.json()) as ApiCamera[];

  return data.map(mapCameraFromApi);
}

export async function getCameraById(
  cameraId: string,
  signal?: AbortSignal,
): Promise<Camera> {
  const response = await fetch(
    createApiUrl(API_CONFIG.apiBaseUrl, `/cameras/${cameraId}`),
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

  const data = (await response.json()) as ApiCamera;

  return mapCameraFromApi(data);
}