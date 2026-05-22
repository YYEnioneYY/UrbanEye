export type NavLinkItem = {
  label: string;
  path: string;
};

export const navLinks: NavLinkItem[] = [
  {
    label: 'Главная',
    path: '/',
  },
  {
    label: 'Карта',
    path: '/map',
  },
  {
    label: 'Экскурсии',
    path: '/excursions',
  },
  {
    label: 'Популярные места',
    path: '/popular-places',
  },
  {
    label: 'О проекте',
    path: '/about',
  },
];