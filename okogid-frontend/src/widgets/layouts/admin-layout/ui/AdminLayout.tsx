import { Link, NavLink, Outlet } from 'react-router';

import { adminSidebarLinks } from '../model/adminSidebarLinks';

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

function AdminIcon() {
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
      <path d="M12 3 5 6v5c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3Z" />
      <path d="M9.5 12.5 11 14l3.5-4" />
    </svg>
  );
}

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[292px] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
        <Link
          to="/"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-solid)] text-[var(--color-text-primary)] transition hover:scale-105 hover:text-[var(--color-primary)]"
          aria-label="Вернуться на главную"
        >
          <ArrowLeftIcon />
        </Link>

        <div className="mt-7 rounded-[26px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-text)]">
              <AdminIcon />
            </div>

            <div>
              <p className="text-lg font-extrabold leading-none">
                Админ панель
              </p>

              <p className="mt-1 font-inter text-xs font-medium text-[var(--color-text-secondary)]">
                Управление ОкоГид
              </p>
            </div>
          </div>
        </div>

        <nav className="mt-5 flex flex-1 flex-col gap-2 overflow-hidden">
          {adminSidebarLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/admin-dashboard'}
              className={({ isActive }) =>
                [
                  'group rounded-[22px] border px-4 py-3 transition',
                  isActive
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-text)]'
                    : 'border-transparent text-[var(--color-text-primary)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-primary)]',
                ].join(' ')
              }
            >
              <span className="block text-sm font-extrabold">
                {link.label}
              </span>

              <span className="mt-1 block font-inter text-xs leading-4 opacity-70">
                {link.description}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="ml-[292px] min-h-screen px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}