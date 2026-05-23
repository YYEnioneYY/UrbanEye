export type TeamMember = {
  id: string;
  name: string;
  role: string;
  description: string;
  initials: string;
  email: string;
  telegram: string;
  github: string;
  schedule: string;
  skills: string[];
};

export const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Беляков Данила',
    role: 'Full Stack Developer',
    description:
      'Отвечает за интерфейс, карту, адаптивность, дизайн-систему и пользовательский опыт.',
    initials: 'БД',
    email: 'danila180204@gmail.com',
    telegram: '@yyenioneyy',
    github: 'github.com/yyenioneyy',
    schedule: 'Пн–Пт, 10:00–19:00',
    skills: ['React', 'TypeScript', 'MapLibre', 'TailwindCSS'],
  },
  {
    id: '2',
    name: 'Мургин Алексей',
    role: 'Backend Developer',
    description:
      'Разрабатывает API, сервис камер, авторизацию, обработку геолокации и интеграции.',
    initials: 'ИК',
    email: 'backend@okogid.ru',
    telegram: '@backend_okogid',
    github: 'github.com/backend-okogid',
    schedule: 'Пн–Пт, 10:00–19:00',
    skills: ['Node.js', 'NestJS', 'PostgreSQL', 'Redis'],
  },
];