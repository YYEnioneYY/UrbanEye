import { Link, NavLink, Outlet } from 'react-router';
import type { ReactNode } from 'react';

import {
  adminSidebarLinks,
  type AdminSidebarLink,
} from '../model/adminSidebarLinks';

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

function OverviewIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  );
}

function CameraAddIcon() {
  return (
    <svg
      className="h-5 w-5"
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
      <path d="M8 13h6" />
      <path d="M11 10v6" />
    </svg>
  );
}

function CamerasIcon() {
  return (
    <svg
      className="h-5 w-5"
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

function UsersIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <path d="M17 11a3 3 0 1 0 0-6" />
      <path d="M22 21a6 6 0 0 0-4-5.65" />
    </svg>
  );
}

function StatisticsIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <rect x="7" y="11" width="3" height="5" rx="1" />
      <rect x="12" y="7" width="3" height="9" rx="1" />
      <rect x="17" y="3" width="3" height="13" rx="1" />
    </svg>
  );
}

function ServicesIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="6" rx="2" />
      <rect x="4" y="14" width="16" height="6" rx="2" />
      <path d="M8 7h.01" />
      <path d="M8 17h.01" />
      <path d="M12 7h4" />
      <path d="M12 17h4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
      <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.65V21a2 2 0 1 1-4 0v-.09A1.8 1.8 0 0 0 8.75 19.3a1.8 1.8 0 0 0-1.98.36l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.8 1.8 0 0 0 4.3 15a1.8 1.8 0 0 0-1.65-1.1H2.5a2 2 0 1 1 0-4h.09A1.8 1.8 0 0 0 4.3 8.75a1.8 1.8 0 0 0-.36-1.98l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.8 1.8 0 0 0 8.75 4.3 1.8 1.8 0 0 0 9.9 2.65V2.5a2 2 0 1 1 4 0v.09A1.8 1.8 0 0 0 15 4.3a1.8 1.8 0 0 0 1.98-.36l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.8 1.8 0 0 0 19.4 8.75a1.8 1.8 0 0 0 1.65 1.1h.09a2 2 0 1 1 0 4h-.09A1.8 1.8 0 0 0 19.4 15Z" />
    </svg>
  );
}

function getAdminSidebarIcon(icon: AdminSidebarLink['icon']) {
  const icons: Record<AdminSidebarLink['icon'], ReactNode> = {
    overview: <OverviewIcon />,
    cameraAdd: <CameraAddIcon />,
    cameras: <CamerasIcon />,
    users: <UsersIcon />,
    statistics: <StatisticsIcon />,
    services: <ServicesIcon />,
    settings: <SettingsIcon />,
  };

  return icons[icon];
}

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[88px] flex-col items-center border-r border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-5 shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
        <Link
          to="/"
          className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-solid)] text-[var(--color-text-primary)] transition hover:scale-105 hover:text-[var(--color-primary)]"
          aria-label="Вернуться на главную"
        >
          <ArrowLeftIcon />

          <span className="pointer-events-none absolute left-full ml-4 w-max max-w-[240px] translate-x-2 rounded-2xl border border-[var(--color-border)] bg-[var(--navbar-bg)] px-4 py-3 text-left opacity-0 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl transition group-hover:translate-x-0 group-hover:opacity-100">
            <span className="block text-sm font-extrabold text-[var(--color-text-primary)]">
              На главную
            </span>
            <span className="mt-1 block font-inter text-xs leading-4 text-[var(--color-text-secondary)]">
              Вернуться на сайт
            </span>
          </span>
        </Link>

        <nav className="mt-6 flex w-full flex-1 flex-col items-center gap-3">
          {adminSidebarLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end
              aria-label={link.label}
              className={({ isActive }) =>
                [
                  'group relative flex h-12 w-12 items-center justify-center rounded-2xl border transition',
                  isActive
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-secondary-text)] shadow-lg shadow-[var(--color-shadow)]'
                    : 'border-transparent bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-primary)]',
                ].join(' ')
              }
            >
              {getAdminSidebarIcon(link.icon)}

              <span className="pointer-events-none absolute left-full z-50 ml-4 w-max max-w-[260px] translate-x-2 rounded-2xl border border-[var(--color-border)] bg-[var(--navbar-bg)] px-4 py-3 text-left opacity-0 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl transition group-hover:translate-x-0 group-hover:opacity-100">
                <span className="block text-sm font-extrabold text-[var(--color-text-primary)]">
                  {link.label}
                </span>

                <span className="mt-1 block font-inter text-xs leading-4 text-[var(--color-text-secondary)]">
                  {link.description}
                </span>
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="ml-[88px] min-h-screen px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}