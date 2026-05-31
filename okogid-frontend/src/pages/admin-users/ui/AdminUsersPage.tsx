import { useEffect, useMemo, useState } from 'react';

import type { User } from '../../../entities/user/model/types';
import {
  getAdminUsers,
  type AdminUsersMeta,
} from '../../../entities/user/api/adminUsersApi';

const DEFAULT_META: AdminUsersMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getRoleLabel(role: User['role']) {
  if (role === 'admin') return 'Админ';
  return 'Пользователь';
}

function getRoleClassName(role: User['role']) {
  if (role === 'admin') {
    return 'bg-[var(--color-primary)] text-[var(--color-secondary-text)]';
  }

  return 'bg-[var(--color-bg-soft)] text-[var(--color-text-secondary)]';
}

function SearchIcon() {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className="h-7 w-7"
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

function EmptyState() {
  return (
    <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-text)]">
        <UsersIcon />
      </div>

      <h2 className="mt-5 text-2xl font-extrabold text-[var(--color-text-primary)]">
        Пользователи не найдены
      </h2>

      <p className="mx-auto mt-3 max-w-md font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
        Попробуйте изменить поисковый запрос или включить отображение удалённых
        аккаунтов.
      </p>
    </div>
  );
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<AdminUsersMeta>(DEFAULT_META);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const usersCountLabel = useMemo(() => {
    if (meta.total === 0) return 'Нет пользователей';

    return `${meta.total} пользователей`;
  }, [meta.total]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 450);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadUsers() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await getAdminUsers(
          {
            page,
            limit,
            search: debouncedSearch,
            includeDeleted,
          },
          abortController.signal,
        );

        setUsers(response.data);
        setMeta(response.meta);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить пользователей';

        setError(message);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      abortController.abort();
    };
  }, [page, limit, debouncedSearch, includeDeleted]);

  const handleLimitChange = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  };

  const handleIncludeDeletedChange = (checked: boolean) => {
    setIncludeDeleted(checked);
    setPage(1);
  };

  return (
    <section>
      <div className="mb-8">

        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
              Пользователи
            </h1>
          </div>

          <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
            <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              Всего
            </p>

            <p className="mt-1 text-2xl font-extrabold text-[var(--color-primary)]">
              {usersCountLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto] xl:items-center">
          <label className="flex h-12 items-center gap-3 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 text-[var(--color-text-secondary)] transition focus-within:border-[var(--color-primary)]">
            <SearchIcon />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по email..."
              className="w-full border-none bg-transparent font-inter text-sm font-semibold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]"
            />
          </label>

          <label className="flex h-12 cursor-pointer items-center justify-between gap-3 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 font-inter text-sm font-semibold text-[var(--color-text-primary)]">
            <span>Показывать удалённых</span>

            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(event) =>
                handleIncludeDeletedChange(event.target.checked)
              }
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
          </label>

          <select
            value={limit}
            onChange={(event) => handleLimitChange(Number(event.target.value))}
            className="h-12 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 font-inter text-sm font-semibold text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)]"
          >
            <option value={10}>10 на странице</option>
            <option value={20}>20 на странице</option>
            <option value={50}>50 на странице</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-[24px] border border-red-500/20 bg-red-500/10 px-5 py-4 font-inter text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[var(--color-text-primary)]">
                Список пользователей
              </h2>

              <p className="mt-1 font-inter text-sm text-[var(--color-text-secondary)]">
                Страница {meta.page} из {meta.totalPages || 1}
              </p>
            </div>

            {isLoading && (
              <span className="rounded-full bg-[var(--color-bg-soft)] px-3 py-1 font-inter text-xs font-bold text-[var(--color-text-secondary)]">
                Загрузка...
              </span>
            )}
          </div>
        </div>

        {users.length === 0 && !isLoading ? (
          <div className="p-5">
            <EmptyState />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-soft)] text-left">
                  <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Пользователь
                  </th>
                  <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Роль
                  </th>
                  <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Дата создания
                  </th>
                  <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Обновлён
                  </th>
                  <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Статус
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => {
                  const isDeleted = Boolean(user.deletedAt);

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-[var(--color-border)] transition last:border-b-0 hover:bg-[var(--color-bg-soft)]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-extrabold text-[var(--color-secondary-text)]">
                            {user.email.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="font-inter text-sm font-bold text-[var(--color-text-primary)]">
                              {user.email}
                            </p>

                            <p className="mt-1 max-w-[280px] truncate font-inter text-xs text-[var(--color-text-secondary)]">
                              {user.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={[
                            'inline-flex rounded-full px-3 py-1 font-inter text-xs font-bold',
                            getRoleClassName(user.role),
                          ].join(' ')}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-inter text-sm font-semibold text-[var(--color-text-secondary)]">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="px-5 py-4 font-inter text-sm font-semibold text-[var(--color-text-secondary)]">
                        {formatDate(user.updatedAt)}
                      </td>

                      <td className="px-5 py-4">
                        {isDeleted ? (
                          <span className="inline-flex rounded-full bg-red-500/10 px-3 py-1 font-inter text-xs font-bold text-red-600">
                            Удалён
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-green-500/10 px-3 py-1 font-inter text-xs font-bold text-green-600">
                            Активен
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-inter text-sm text-[var(--color-text-secondary)]">
            Показано {users.length} из {meta.total}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!meta.hasPreviousPage || isLoading}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="h-10 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-4 font-inter text-sm font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Назад
            </button>

            <div className="flex h-10 min-w-10 items-center justify-center rounded-[14px] bg-[var(--color-primary)] px-3 font-inter text-sm font-extrabold text-[var(--color-secondary-text)]">
              {meta.page}
            </div>

            <button
              type="button"
              disabled={!meta.hasNextPage || isLoading}
              onClick={() => setPage((prev) => prev + 1)}
              className="h-10 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-4 font-inter text-sm font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Далее
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}