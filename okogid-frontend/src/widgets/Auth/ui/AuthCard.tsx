import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { login, register } from '../../../features/auth/api/authApi';
import {
  validateEmail,
  validatePassword,
  validatePasswordRepeat,
} from '../../../features/auth/lib/authValidation';
import { useAuthStore } from '../../../features/auth/model/authStore';

import { AuthInput } from './AuthInput';
import { AuthPasswordInput } from './AuthPasswordInput';
import { AuthTabs } from './AuthTabs';

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

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError) {
      setError(emailError);
      return;
    }

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!isLogin) {
      const repeatPasswordError = validatePasswordRepeat(
        password,
        repeatPassword,
      );

      if (repeatPasswordError) {
        setError(repeatPasswordError);
        return;
      }
    }

    try {
      setIsLoading(true);

      const authData = isLogin
        ? await login({
            email,
            password,
          })
        : await register({
            email,
            password,
          });

      setAuth(authData);

      navigate('/map');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Что-то пошло не так. Попробуйте ещё раз.';

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

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

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <AuthInput
          icon={<MailIcon />}
          type="email"
          placeholder="Введите email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />

        <AuthPasswordInput
          placeholder={isLogin ? 'Введите пароль' : 'Придумайте пароль'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
        />

        {!isLogin && (
          <AuthPasswordInput
            placeholder="Повторите пароль"
            value={repeatPassword}
            onChange={(event) => setRepeatPassword(event.target.value)}
            autoComplete="new-password"
          />
        )}

        {error && (
          <div className="rounded-[18px] border border-red-500/20 bg-red-500/10 px-4 py-3 font-inter text-[12px] font-medium text-red-600">
            {error}
          </div>
        )}

        {isLogin && (
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="font-inter text-sm font-medium text-[var(--color-primary)] transition hover:opacity-80"
            >
              Забыли пароль?
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 h-13 w-full rounded-[18px] bg-[var(--button-third-bg)] text-[16px] font-semibold text-[var(--button-third-text)] shadow-sm transition hover:scale-[1.01] hover:bg-[var(--button-third-hover)] disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100"
        >
          {isLoading
            ? isLogin
              ? 'Входим...'
              : 'Регистрируем...'
            : isLogin
              ? 'Войти'
              : 'Зарегистрироваться'}
        </button>
      </form>

      <div className="mt-8 text-center font-inter text-[12px] text-[var(--color-text-primary)]">
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