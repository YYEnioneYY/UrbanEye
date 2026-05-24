export type TeamMember = {
  id: string;
  name: string;
  role: string;
  description: string;
  initials: string;
  email: string;
  telegram: string;
  github: string;
  telegramUrl: string;
  githubUrl: string;
  schedule: string;
  skills: string[];
};

export const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Беляков Данила',
    role: 'Full Stack Developer',
    description:
      'Отвечает за интерфейс, карту, адаптивность, дизайн-систему, пользовательский опыт, а также разрабатывает API, авторизацию, обработку геолокации.',
    initials: 'БД',
    email: 'danila180204@gmail.com',
    telegram: '@yyenioneyy',
    github: 'github.com/yyenioneyy',
    telegramUrl: 'https://t.me/yyenioneyy',
    githubUrl: 'https://github.com/YYEnioneYY',
    schedule: 'Пн–Пт, 10:00–19:00',
    skills: ['React', 'TypeScript', 'MapLibre', 'TailwindCSS', 'NestJS', 'Kafka', 'MediaMTX'],
  },
  {
    id: '2',
    name: 'Мургин Алексей',
    role: 'Backend Developer',
    description:
      'Разрабатывает API, сервис камер и интеграции.',
    initials: 'ИК',
    email: 'backend@okogid.ru',
    telegram: '@amurchalo',
    github: 'github.com/amurchalo-lemur',
    telegramUrl: 'https://t.me/amurchalo',
    githubUrl: 'https://github.com/amurchalo-lemur',
    schedule: 'Пн–Пт, 10:00–19:00',
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'PostGIS', 'API', 'Kafka'],
  },
];