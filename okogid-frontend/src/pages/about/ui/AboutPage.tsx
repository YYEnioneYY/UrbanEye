import { Link } from 'react-router';

import { teamMembers } from '../model/teamMembers';

function CameraIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 8h10a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
      <path d="m17 12 5-3v10l-5-3" />
      <path d="M7 8l1.5-3h4L14 8" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
      <path d="M9 3v15" />
      <path d="M15 6v15" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6" cy="19" r="3" />
      <circle cx="18" cy="5" r="3" />
      <path d="M12 19h2a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

const projectStats = [
  {
    value: '24/7',
    label: 'доступ к городским камерам',
  },
  {
    value: '3',
    label: 'режима темы интерфейса',
  },
  {
    value: '100+',
    label: 'камер в будущей базе',
  },
  {
    value: 'Live',
    label: 'реальное время на карте',
  },
];

const projectFeatures = [
  {
    title: 'Живые камеры',
    description:
      'Пользователь может открыть карту, выбрать камеру и посмотреть город в реальном времени.',
    icon: <CameraIcon />,
  },
  {
    title: 'Интерактивная карта',
    description:
      'Камеры отображаются на карте с кастомными метками, карточками и фильтрами.',
    icon: <MapIcon />,
  },
  {
    title: 'Онлайн-экскурсии',
    description:
      'На основе камер можно собирать маршруты, интересные места и живые экскурсии.',
    icon: <RouteIcon />,
  },
];

export function AboutPage() {
  return (
    <div className="bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <section className="px-4 pb-16 pt-10 md:px-8 md:pb-24 md:pt-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] shadow-sm backdrop-blur-xl">
                О проекте ОкоГид
              </div>

              <h1 className="mt-6 max-w-4xl text-[42px] font-extrabold leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[64px]">
                Город, который можно увидеть{' '}
                <span className="text-[var(--color-primary)]">
                  в реальном времени
                </span>
              </h1>

              <p className="mt-6 max-w-2xl font-inter text-base leading-7 text-[var(--color-text-secondary)] md:text-lg">
                ОкоГид — это интерактивная карта с городскими IP-камерами,
                популярными местами и онлайн-экскурсиями. Мы хотим сделать
                путешествия, прогулки и знакомство с городами более живыми,
                удобными и доступными.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/map"
                  className="inline-flex h-12 items-center justify-center rounded-[18px] bg-[var(--button-third-bg)] px-6 text-sm font-bold text-[var(--button-third-text)] shadow-sm transition hover:scale-[1.02] hover:bg-[var(--button-third-hover)]"
                >
                  Открыть карту
                </Link>

                <Link
                  to="/excursions"
                  className="inline-flex h-12 items-center justify-center rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 text-sm font-bold text-[var(--color-text-primary)] backdrop-blur-xl transition hover:scale-[1.02] hover:text-[var(--color-primary)]"
                >
                  Смотреть экскурсии
                </Link>
              </div>
            </div>

            <div className="rounded-[36px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
              <div className="rounded-[28px] bg-[var(--color-bg-soft)] p-5">
                <div className="grid grid-cols-2 gap-3">
                  {projectStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] p-5"
                    >
                      <p className="text-3xl font-extrabold text-[var(--color-primary)]">
                        {stat.value}
                      </p>

                      <p className="mt-2 font-inter text-sm leading-5 text-[var(--color-text-secondary)]">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] p-5">
                  <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Главная идея
                  </p>

                  <p className="mt-3 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
                    Не просто показать карту, а дать человеку ощущение
                    присутствия: открыть камеру, увидеть место, выбрать маршрут
                    и понять атмосферу города ещё до прогулки.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-primary)]">
              Возможности
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">
              Что делает проект
            </h2>

            <p className="mt-4 font-inter text-base leading-7 text-[var(--color-text-secondary)]">
              ОкоГид объединяет карту, камеры, места и маршруты в один
              городской сервис. Пользователь может быстро понять, что
              происходит в конкретной точке города прямо сейчас.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {projectFeatures.map((feature) => (
              <article
                key={feature.title}
                className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl transition hover:-translate-y-1"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-secondary-text)]">
                  {feature.icon}
                </div>

                <h3 className="mt-5 text-xl font-extrabold">
                  {feature.title}
                </h3>

                <p className="mt-3 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-primary)]">
                Команда
              </p>

              <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">
                Кто создаёт ОкоГид
              </h2>

              <p className="mt-4 font-inter text-base leading-7 text-[var(--color-text-secondary)]">
                Над проектом работает команда разработчиков, дизайнеров и
                инженеров потокового видео. Каждый отвечает за свою часть
                системы: интерфейс, backend, карту, камеры и визуальный стиль.
              </p>

              <div className="mt-6 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 backdrop-blur-2xl">
                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                  Общий график поддержки
                </p>

                <p className="mt-2 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
                  Поддержка проекта работает ежедневно. Вопросы по камерам,
                  маршрутам и ошибкам интерфейса можно отправлять через форму
                  обратной связи или на email команды.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {teamMembers.map((member) => (
                <article
                  key={member.id}
                  className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-lg font-extrabold text-[var(--color-secondary-text)]">
                      {member.initials}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-lg font-extrabold text-[var(--color-text-primary)]">
                        {member.name}
                      </h3>

                      <p className="mt-1 font-inter text-sm font-semibold text-[var(--color-primary)]">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
                    {member.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {member.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 py-1 font-inter text-xs font-semibold text-[var(--color-text-secondary)]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 space-y-2 border-t border-[var(--color-border)] pt-4">
                    <a
                      href={`mailto:${member.email}`}
                      className="flex items-center gap-2 font-inter text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
                    >
                      <MailIcon />
                      {member.email}
                    </a>
                                    
                    <div className="flex items-center gap-2 font-inter text-sm text-[var(--color-text-secondary)]">
                      <ClockIcon />
                      {member.schedule}
                    </div>
                                    
                    <a
                      href={member.telegramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block font-inter text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
                    >
                      Telegram:{' '}
                      <span className="font-semibold text-[var(--color-text-primary)] transition group-hover:text-[var(--color-primary)]">
                        {member.telegram}
                      </span>
                    </a>
                                    
                    <a
                      href={member.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block font-inter text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
                    >
                      GitHub:{' '}
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {member.github}
                      </span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[36px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl md:p-10">
            <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-primary)]">
              Присоединяйтесь
            </p>

            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-extrabold tracking-tight md:text-5xl">
              Откройте город через живую карту
            </h2>

            <p className="mx-auto mt-4 max-w-2xl font-inter text-base leading-7 text-[var(--color-text-secondary)]">
              Начните с карты: выберите место, посмотрите доступные камеры и
              почувствуйте атмосферу города в реальном времени.
            </p>

            <Link
              to="/map"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-[18px] bg-[var(--button-third-bg)] px-6 text-sm font-bold text-[var(--button-third-text)] shadow-sm transition hover:scale-[1.02] hover:bg-[var(--button-third-hover)]"
            >
              Перейти на карту
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}