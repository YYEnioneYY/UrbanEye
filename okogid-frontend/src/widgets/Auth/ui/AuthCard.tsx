import { Link } from 'react-router';

import { AuthInput } from './AuthInput';
import { AuthTabs } from './AuthTabs';
import { AuthPasswordInput } from './AuthPasswordInput';

type AuthCardProps = {
  mode: 'login' | 'register';
};

function MailIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function AuthCard({ mode }: AuthCardProps) {
  const isLogin = mode === 'login';

  return (
    <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-auth-card-bg)] p-6 shadow-[0_24px_80px_rgba(15,19,24,0.12)] backdrop-blur-2xl sm:p-8">
      <AuthTabs />

      <div className="px-2 pb-2 pt-10 text-center">
        <h1 className="text-[20px] font-bold leading-tight text-[var(--color-text-primary)] sm:text-[26px]">
          {isLogin ? (
            <>
              Добро пожаловать в
              <br />
              <span className="text-[var(--color-primary)]">ОкоГид</span>
            </>
          ) : (
            <>
              Создайте аккаунт в
              <br />
              <span className="text-[var(--color-primary)]">ОкоГид</span>
            </>
          )}
        </h1>
      </div>

      <form className="mt-8 space-y-5">

        <AuthInput
          icon={<MailIcon />}
          type="email"
          placeholder="Введите email"
        />

        <AuthPasswordInput
          placeholder={isLogin ? 'Введите пароль' : 'Придумайте пароль'}
        />

        {!isLogin && (
          <AuthPasswordInput placeholder="Повторите пароль" />
        )}

        {isLogin && (
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-[var(--color-primary)] font-inter transition hover:opacity-80"
            >
              Забыли пароль?
            </Link>
          </div>
        )}

        <button
          type="submit"
          className="mt-2 h-13 w-full rounded-[18px] bg-[var(--button-third-bg)] text-[16px] font-semibold text-[var(--button-third-text)] shadow-sm transition hover:scale-[1.01] hover:bg-[var(--button-third-hover)]"
        >
          {isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      <div className="mt-8 text-center text-[12px] font-inter text-[var(--color-text-primary)]">
        {isLogin ? (
          <>
            У вас нет аккаунта?{' '}
            <Link
              to="/register"
              className="font-medium text-[var(--color-primary)] underline underline-offset-2"
            >
              Зарегистрироваться
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{' '}
            <Link
              to="/login"
              className="font-medium text-[var(--color-primary)] underline underline-offset-2"
            >
              Войти
            </Link>
          </>
        )}
      </div>
    </div>
  );
}