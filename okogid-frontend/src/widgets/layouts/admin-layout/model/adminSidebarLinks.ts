export type AdminSidebarLink = {
  label: string;
  path: string;
  description: string;
  icon: 'overview' | 'cameraAdd' | 'cameras' | 'users' | 'statistics' | 'services' | 'settings';
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