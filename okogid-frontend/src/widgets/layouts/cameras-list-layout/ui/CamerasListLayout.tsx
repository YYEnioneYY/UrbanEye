import { NavLink, Outlet, useNavigate } from 'react-router';

function ArrowLeftIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

const layoutTabs = [
  {
    label: 'Все камеры',
    to: '/cameras',
  },
  {
    label: 'Видеостена',
    to: '/cameras-monitor',
  },
];

export function CamerasListLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="fixed left-5 top-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--navbar-bg)] text-[var(--color-text-primary)] shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl transition hover:scale-105 hover:text-[var(--color-primary)]"
        aria-label="Назад"
      >
        <ArrowLeftIcon />
      </button>

      <div className="fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-[22px] border border-[var(--color-border)] bg-[var(--navbar-bg)] p-1 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
        <div className="flex items-center gap-1">
          {layoutTabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              className={({ isActive }) =>
                [
                  'flex h-10 items-center justify-center rounded-[18px] px-5 font-inter text-xs font-extrabold transition',
                  isActive
                    ? 'bg-[var(--color-primary)] text-[var(--color-secondary-text)]'
                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-primary)]',
                ].join(' ')
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>

      <Outlet />
    </div>
  );
}