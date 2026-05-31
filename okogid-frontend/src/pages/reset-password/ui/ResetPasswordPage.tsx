import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { resetPassword } from '../../../features/auth/api/passwordRecoveryApi';
import {
  validatePassword,
  validatePasswordRepeat,
} from '../../../features/auth/lib/authValidation';
import { AuthPasswordInput } from '../../../widgets/Auth/ui/AuthPasswordInput';

function ArrowLeftIcon() {
  return (
    <svg
      className="h-4 w-4"
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

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setSuccessMessage(null);

    if (!token) {
      setError('Токен восстановления не найден. Откройте ссылку из письма ещё раз.');
      return;
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      setError(passwordError);
      return;
    }

    const repeatPasswordError = validatePasswordRepeat(
      password,
      repeatPassword,
    );

    if (repeatPasswordError) {
      setError(repeatPasswordError);
      return;
    }

    try {
      setIsLoading(true);

      const response = await resetPassword({
        token,
        password,
      });

      setSuccessMessage(
        response.message || 'Пароль успешно изменён. Теперь можно войти.',
      );

      window.setTimeout(() => {
        navigate('/login');
      }, 1400);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Не удалось изменить пароль.';

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-auth-card-bg)] p-6 shadow-[0_24px_80px_rgba(15,19,24,0.12)] backdrop-blur-2xl sm:p-8">
      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-[12px] font-medium text-[var(--color-primary)] transition hover:opacity-80"
      >
        <ArrowLeftIcon />
        Вернуться ко входу
      </Link>

      <div className="px-2 pb-2 pt-10 text-center">
        <h1 className="text-[20px] font-bold leading-tight text-[var(--color-text-primary)] sm:text-[26px]">
          Новый
          <br />
          <span className="text-[var(--color-primary)]">пароль</span>
        </h1>

        <p className="mx-auto mt-4 max-w-[320px] font-inter text-[13px] leading-5 text-[var(--color-text-secondary)]">
          Придумайте новый пароль для аккаунта. После успешной смены мы
          перенаправим вас на страницу входа.
        </p>
      </div>

      {!token && (
        <div className="mt-8 rounded-[18px] border border-red-500/20 bg-red-500/10 px-4 py-3 font-inter text-[12px] font-medium text-red-600">
          В ссылке отсутствует token. Запросите восстановление пароля заново.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <AuthPasswordInput
          placeholder="Введите новый пароль"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          disabled={!token || isLoading}
        />

        <AuthPasswordInput
          placeholder="Повторите новый пароль"
          value={repeatPassword}
          onChange={(event) => setRepeatPassword(event.target.value)}
          autoComplete="new-password"
          disabled={!token || isLoading}
        />

        {error && (
          <div className="rounded-[18px] border border-red-500/20 bg-red-500/10 px-4 py-3 font-inter text-[12px] font-medium text-red-600">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-[18px] border border-green-500/20 bg-green-500/10 px-4 py-3 font-inter text-[12px] font-medium text-green-600">
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={!token || isLoading}
          className="mt-2 h-13 w-full rounded-[18px] bg-[var(--button-third-bg)] text-[16px] font-semibold text-[var(--button-third-text)] shadow-sm transition hover:scale-[1.01] hover:bg-[var(--button-third-hover)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
        >
          {isLoading ? 'Сохраняем...' : 'Изменить пароль'}
        </button>
      </form>

      <div className="mt-8 text-center font-inter text-[12px] text-[var(--color-text-primary)]">
        Уже изменили пароль?{' '}
        <Link
          to="/login"
          className="font-medium text-[var(--color-primary)] underline underline-offset-2"
        >
          Войти
        </Link>
      </div>
    </div>
  );
}