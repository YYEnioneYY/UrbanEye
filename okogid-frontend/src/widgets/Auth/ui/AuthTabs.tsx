import { NavLink } from 'react-router';

export function AuthTabs() {
  return (
    <div className="grid grid-cols-2 rounded-2xl bg-[var(--color-auth-tab)] p-1">
      <NavLink
        to="/login"
        className={({ isActive }) =>
          [
            'flex h-14 items-center justify-center rounded-[18px] text-lg font-bold transition',
            isActive
              ? 'bg-[var(--color-auth-tab-active)] text-[var(--color-primary)]'
              : 'text-[var(--color-text-primary)] hover:text-[var(--color-primary)]',
          ].join(' ')
        }
      >
        Вход
      </NavLink>

      <NavLink
        to="/register"
        className={({ isActive }) =>
          [
            'flex h-14 items-center justify-center rounded-[18px] text-lg font-bold transition',
            isActive
              ? 'bg-[var(--color-auth-tab-active)] text-[var(--color-primary)]'
              : 'text-[var(--color-text-primary)] hover:text-[var(--color-primary)]',
          ].join(' ')
        }
      >
        Регистрация
      </NavLink>
    </div>
  );
}