import { Link } from 'react-router';

import { useAuthStore } from '../model/authStore';
import { useLogout } from '../model/useLogout';

function getUserInitial(email: string) {
  return email.trim().charAt(0).toUpperCase();
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

export function AuthMenuBlock() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { logout, isLoading } = useLogout({
    redirectTo: '/',
  });

  if (!isAuthenticated || !user) {
    return (
      <Link
        to="/login"
        className="mt-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-center text-sm font-bold text-[var(--button-enter-text)] transition hover:scale-[1.01] hover:text-[var(--color-primary)]"
      >
        Войти
      </Link>
    );
  }

  return (
    <div className="mt-2 rounded-[22px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-extrabold text-[var(--color-secondary-text)]">
          {getUserInitial(user.email)}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--color-text-primary)]">
            Профиль
          </p>

          <p className="mt-1 truncate font-inter text-xs text-[var(--color-text-secondary)]">
            {user.email}
          </p>
        </div>
      </div>

      <Link
        to="/profile"
        className="mt-3 flex w-full items-center justify-center rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)]"
      >
        Открыть профиль
      </Link>

      <button
        type="button"
        onClick={logout}
        disabled={isLoading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)] disabled:cursor-wait disabled:opacity-70"
      >
        <LogoutIcon />
        {isLoading ? 'Выходим...' : 'Выйти'}
      </button>
    </div>
  );
}