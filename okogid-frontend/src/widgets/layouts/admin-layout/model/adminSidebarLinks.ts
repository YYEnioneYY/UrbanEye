export type AdminSidebarLink = {
  label: string;
  path: string;
  description: string;
};

export const adminSidebarLinks: AdminSidebarLink[] = [
  {
    label: 'Обзор',
    path: '/admin-dashboard',
    description: 'Главная админ-панель',
  },
  {
    label: 'Добавить камеру',
    path: '/admin-dashboard/cameras/new',
    description: 'Создание новой камеры',
  },
  {
    label: 'Камеры',
    path: '/admin-dashboard/cameras',
    description: 'Список всех камер',
  },
  {
    label: 'Пользователи',
    path: '/admin-dashboard/users',
    description: 'Аккаунты и роли',
  },
  {
    label: 'Статистика',
    path: '/admin-dashboard/statistics',
    description: 'Просмотры и активность',
  },
  {
    label: 'Статусы сервисов',
    path: '/admin-dashboard/services',
    description: 'Проверка микросервисов',
  },
  {
    label: 'Настройки',
    path: '/admin-dashboard/settings',
    description: 'Параметры системы',
  },
];