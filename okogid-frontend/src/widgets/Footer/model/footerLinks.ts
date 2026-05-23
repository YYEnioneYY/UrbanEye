export type FooterLinkItem = {
  label: string;
  path: string;
};

export type FooterColumn = {
  title: string;
  links: FooterLinkItem[];
};

export const footerColumns: FooterColumn[] = [
  {
    title: 'Сервис',
    links: [
      {
        label: 'Карта',
        path: '/map',
      },
      {
        label: 'Популярные места',
        path: '/popular',
      },
      {
        label: 'Экскурсии и маршруты',
        path: '/excursions',
      },
      {
        label: 'Поиск камер',
        path: '/map',
      },
    ],
  },
  {
    title: 'О проекте',
    links: [
      {
        label: 'О нас',
        path: '/about',
      },
      {
        label: 'Как это работает',
        path: '/how-it-works',
      },
      {
        label: 'Партнёрам',
        path: '/partners',
      },
      {
        label: 'Блог',
        path: '/blog',
      },
    ],
  },
  {
    title: 'Поддержка',
    links: [
      {
        label: 'Помощь',
        path: '/help',
      },
      {
        label: 'Частые вопросы',
        path: '/faq',
      },
      {
        label: 'Обратная связь',
        path: '/feedback',
      },
      {
        label: 'Правила сервиса',
        path: '/rules',
      },
    ],
  },
];