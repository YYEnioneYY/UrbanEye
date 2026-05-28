import type { Camera } from '../../camera/model/types';

export type CameraStreamType = 'webrtc';

export type CameraStream = {
  type: CameraStreamType;
  path: string;
  playerUrl: string;
  whepUrl: string;
};

export type CameraStreamResponse = {
  camera: Camera;
  stream: CameraStream;
};