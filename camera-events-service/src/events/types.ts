export type NormalizedCameraEvent = {
  id: string;
  type: string;
  cameraId: string;
  intersectionId: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  confidence: number | null;
  metadata: Record<string, unknown>;
  occurredAt: Date;
  createdAt: Date;
};

export type RawExternalCameraEvent = {
  type?: string;
  event?: string;
  eventType?: string;

  title?: string;
  description?: string;

  imageUrl?: string;
  imageBase64?: string;

  confidence?: number;

  metadata?: Record<string, unknown>;

  occurredAt?: string;
  timestamp?: string;
  time?: string;

  [key: string]: unknown;
};