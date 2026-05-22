import type { Camera } from '../../../entities/camera/model/types';

export function createCameraMarkerElement(camera: Camera) {
  const marker = document.createElement('div');

  marker.className = `camera-marker camera-marker--${camera.status}`;

  marker.innerHTML = `
    <button class="camera-marker__button" type="button" aria-label="${camera.title}">
      <span class="camera-marker__pulse"></span>

      <span class="camera-marker__body">
        <span class="camera-marker__lens"></span>
        <span class="camera-marker__dot"></span>
      </span>
    </button>
  `;

  return marker;
}