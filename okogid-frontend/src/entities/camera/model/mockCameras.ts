import type { Camera } from './types';

export const mockCameras: Camera[] = [
  {
    id: '1',
    title: 'Дворцовая площадь',
    description: 'Камера рядом с главным городским пространством.',
    latitude: 59.9398,
    longitude: 30.3146,
    status: 'online',
  },
  {
    id: '2',
    title: 'Исаакиевский собор',
    description: 'Вид на исторический центр.',
    latitude: 59.9343,
    longitude: 30.3061,
    status: 'online',
  },
  {
    id: '3',
    title: 'Петропавловская крепость',
    description: 'Камера у Невы.',
    latitude: 59.9500,
    longitude: 30.3167,
    status: 'offline',
  },
];