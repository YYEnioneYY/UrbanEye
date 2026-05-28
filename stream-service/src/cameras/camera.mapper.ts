import { CameraConfig, PublicCamera } from './camera.types';

export function toPublicCamera(camera: CameraConfig): PublicCamera {
  const { rtspUrl, ...publicCamera } = camera;

  return {
    ...publicCamera,
    streamEndpoint: `/streams/${camera.id}`,
  };
}