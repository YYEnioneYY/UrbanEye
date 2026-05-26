type JwtPayload = {
  exp?: number;
};

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

  return atob(padded);
}

export function getJwtExpirationMs(token: string) {
  try {
    const [, payload] = token.split('.');

    if (!payload) {
      return null;
    }

    const decoded = decodeBase64Url(payload);
    const data = JSON.parse(decoded) as JwtPayload;

    if (!data.exp) {
      return null;
    }

    return data.exp * 1000;
  } catch {
    return null;
  }
}

export function getRefreshDelayMs(token: string) {
  const expirationMs = getJwtExpirationMs(token);

  if (!expirationMs) {
    return 10 * 60 * 1000;
  }

  const oneMinute = 60 * 1000;
  const delay = expirationMs - Date.now() - oneMinute;

  return Math.max(delay, 5 * 1000);
}