import type { Camera } from '../../camera/model/types';

export type CameraStream = {
  type: 'webrtc' | string;
  path: string;
  playerUrl: string;
  whepUrl: string;
};

export type CameraStreamResponse = {
  camera: Camera;
  stream: CameraStream;
};