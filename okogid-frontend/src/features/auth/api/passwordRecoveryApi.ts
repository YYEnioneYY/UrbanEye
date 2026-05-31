import { API_CONFIG, createApiUrl } from '../../../shared/config/api';
import { getApiErrorMessage } from '../lib/getApiErrorMessage';

type ApiMessageResponse = {
  message?: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
};

export async function forgotPassword(
  payload: ForgotPasswordPayload,
): Promise<ApiMessageResponse> {
  const response = await fetch(
    createApiUrl(API_CONFIG.apiBaseUrl, '/auth/forgot-password'),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  return response.json() as Promise<ApiMessageResponse>;
}

export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<ApiMessageResponse> {
  const response = await fetch(
    createApiUrl(API_CONFIG.apiBaseUrl, '/auth/reset-password'),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  return response.json() as Promise<ApiMessageResponse>;
}