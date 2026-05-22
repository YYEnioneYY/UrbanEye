export function createUserLocationMarkerElement() {
  const marker = document.createElement('div');

  marker.className = 'user-location-marker';

  marker.innerHTML = `
    <span class="user-location-marker__pulse"></span>
    <span class="user-location-marker__body">
      <span class="user-location-marker__dot"></span>
    </span>
  `;

  return marker;
}