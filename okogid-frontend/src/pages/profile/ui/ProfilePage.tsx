import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';

import type { User } from '../../../entities/user/model/types';
import { getCurrentUser } from '../../../entities/user/api/getCurrentUser';
import { useAuthStore } from '../../../features/auth/model/authStore';
import { useLogout } from '../../../features/auth/model/useLogout';

function getUserInitial(email: string) {
  return email.trim().charAt(0).toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function MailIcon() {
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
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function IdIcon() {
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
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
    </svg>
  );
}

function CalendarIcon() {
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
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M3 10h18" />
    </svg>
  );
}

function UserDataCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-secondary-text)]">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            {label}
          </p>

          <p className="mt-2 break-words font-inter text-sm font-semibold leading-6 text-[var(--color-text-primary)]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSessionLoading = useAuthStore((state) => state.isSessionLoading);
  const storeUser = useAuthStore((state) => state.user);

  const { logout, isLoading: isLogoutLoading } = useLogout({
    redirectTo: '/',
  });

  const [profile, setProfile] = useState<User | null>(storeUser);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }

    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    let isActive = true;

    async function loadProfile() {
      try {
        setIsLoading(true);
        setError(null);

        const user = await getCurrentUser();

        if (!isActive) {
          return;
        }

        setProfile(user);
      } catch (error) {
        if (!isActive) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить профиль';

        setError(message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, isSessionLoading]);

  if (isSessionLoading) {
    return (
      <section className="min-h-[70vh] px-4 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[36px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
            <p className="font-inter text-sm text-[var(--color-text-secondary)]">
              Проверяем сессию...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <section className="bg-[var(--color-bg)] px-4 py-10 text-[var(--color-text-primary)] md:px-8 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] shadow-sm backdrop-blur-xl">
            Личный кабинет
          </div>

          <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-6xl">
            Профиль пользователя
          </h1>
        </div>

        {error && (
          <div className="mb-6 rounded-[24px] border border-red-500/20 bg-red-500/10 px-5 py-4 font-inter text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <aside className="rounded-[36px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-[34px] bg-[var(--color-primary)] text-5xl font-extrabold text-[var(--color-secondary-text)] shadow-xl shadow-[var(--color-shadow)]">
                {profile?.email ? getUserInitial(profile.email) : '?'}
              </div>

              <h2 className="mt-5 max-w-full break-words text-2xl font-extrabold text-[var(--color-text-primary)]">
                {profile?.email ?? 'Пользователь'}
              </h2>

              <p className="mt-2 rounded-full bg-[var(--color-bg-soft)] px-4 py-2 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
                Аккаунт активен
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              <Link
                to="/map"
                className="flex h-12 items-center justify-center rounded-[18px] bg-[var(--button-third-bg)] px-5 text-sm font-bold text-[var(--button-third-text)] transition hover:scale-[1.02] hover:bg-[var(--button-third-hover)]"
              >
                Открыть карту
              </Link>

              <button
                type="button"
                onClick={logout}
                disabled={isLogoutLoading}
                className="flex h-12 items-center justify-center rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-5 text-sm font-bold text-[var(--color-text-primary)] transition hover:scale-[1.02] hover:text-[var(--color-primary)] disabled:cursor-wait disabled:opacity-70"
              >
                {isLogoutLoading ? 'Выходим...' : 'Выйти из аккаунта'}
              </button>
            </div>
          </aside>

          <div className="rounded-[36px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl md:p-6">
            <div className="rounded-[28px] bg-[var(--color-bg-soft)] p-4 md:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)]">
                    Данные аккаунта
                  </h2>
                </div>

                {isLoading && (
                  <span className="rounded-full bg-[var(--color-surface-solid)] px-3 py-1 font-inter text-xs font-semibold text-[var(--color-text-secondary)]">
                    Загрузка...
                  </span>
                )}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <UserDataCard
                  icon={<MailIcon />}
                  label="Email"
                  value={profile?.email ?? '—'}
                />

                <UserDataCard
                  icon={<IdIcon />}
                  label="ID пользователя"
                  value={profile?.id ?? '—'}
                />

                <UserDataCard
                  icon={<CalendarIcon />}
                  label="Дата регистрации"
                  value={profile?.createdAt ? formatDate(profile.createdAt) : '—'}
                />

                <UserDataCard
                  icon={<CalendarIcon />}
                  label="Последнее обновление"
                  value={profile?.updatedAt ? formatDate(profile.updatedAt) : '—'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}