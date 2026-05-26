import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';

import { useAuthStore } from '../model/authStore';
import { useLogout } from '../model/useLogout';

function getUserInitial(email: string) {
  return email.trim().charAt(0).toUpperCase();
}

function UserIcon() {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function LogoutIcon() {
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
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 19V5" />
    </svg>
  );
}

export function AuthHeaderAction() {
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { logout, isLoading } = useLogout({
    redirectTo: '/',
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  if (!isAuthenticated || !user) {
    return (
      <Link
        to="/login"
        className="rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--button-enter-text)] transition hover:scale-[1.03] hover:text-[var(--color-primary)]"
      >
        Войти
      </Link>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Открыть меню профиля"
        aria-expanded={isOpen}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-primary)] text-sm font-extrabold text-[var(--color-secondary-text)] shadow-sm transition hover:scale-[1.05]"
      >
        {getUserInitial(user.email)}
      </button>

      <div
        className={[
          'absolute right-0 top-14 w-[260px] overflow-hidden rounded-[24px]',
          'border border-[var(--color-border)] bg-[var(--navbar-bg)] shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl',
          'transition duration-200',
          isOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-2 opacity-0',
        ].join(' ')}
      >
        <div className="p-3">
          <div className="rounded-[18px] bg-[var(--color-bg-soft)] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-extrabold text-[var(--color-secondary-text)]">
                {getUserInitial(user.email)}
              </div>

              <div className="min-w-0">
                <p className="flex items-center gap-1 text-sm font-bold text-[var(--color-text-primary)]">
                  <UserIcon />
                  Профиль
                </p>

                <p className="mt-1 truncate font-inter text-xs text-[var(--color-text-secondary)]">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="mt-2 flex w-full items-center justify-center rounded-[18px] border border-[var(--color-border)] px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-primary)]"
          >
            Открыть профиль
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-[18px] border border-[var(--color-border)] px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-primary)] disabled:cursor-wait disabled:opacity-70"
          >
            <LogoutIcon />
            {isLoading ? 'Выходим...' : 'Выйти'}
          </button>
        </div>
      </div>
    </div>
  );
}