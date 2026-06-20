export type AdminSidebarLink = {
  label: string;
  path: string;
  description: string;
  icon:
    | 'overview'
    | 'cameraAdd'
    | 'cameras'
    | 'intersectionAdd'
    | 'intersections'
    | 'users'
    | 'statistics'
    | 'services'
    | 'settings';
};

export const adminSidebarLinks: AdminSidebarLink[] = [
  {
    label: 'Обзор',
    path: '/admin-dashboard',
    description: 'Главная админ-панель',
    icon: 'overview',
  },
  {
    label: 'Добавить камеру',
    path: '/admin-dashboard/cameras-add',
    description: 'Создание новой камеры',
    icon: 'cameraAdd',
  },
  {
    label: 'Камеры',
    path: '/admin-dashboard/cameras',
    description: 'Список всех камер',
    icon: 'cameras',
  },
  {
    label: 'Добавить перекрёсток',
    path: '/admin-dashboard/intersections-add',
    description: 'Создание перекрёстка и камер',
    icon: 'intersectionAdd',
  },
  {
    label: 'Перекрёстки',
    path: '/admin-dashboard/intersections',
    description: 'Камеры на перекрёстках',
    icon: 'intersections',
  },
  {
    label: 'Пользователи',
    path: '/admin-dashboard/users',
    description: 'Аккаунты и роли',
    icon: 'users',
  },
  {
    label: 'Статистика',
    path: '/admin-dashboard/statistics',
    description: 'Просмотры и активность',
    icon: 'statistics',
  },
  {
    label: 'Статусы сервисов',
    path: '/admin-dashboard/services',
    description: 'Проверка микросервисов',
    icon: 'services',
  },
  {
    label: 'Настройки',
    path: '/admin-dashboard/settings',
    description: 'Параметры системы',
    icon: 'settings',
  },
];