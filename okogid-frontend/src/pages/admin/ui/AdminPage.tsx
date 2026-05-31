export function AdminPage() {
  return (
    <section>
      <div className="mb-8">
        <div className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] shadow-sm backdrop-blur-xl">
          Dashboard
        </div>

        <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-6xl">
          Панель администратора
        </h1>

        <p className="mt-4 max-w-2xl font-inter text-base leading-7 text-[var(--color-text-secondary)]">
          Здесь будет управление камерами, пользователями, статистикой,
          состоянием сервисов и настройками платформы.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-4 md:grid-cols-2">
        <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
          <p className="font-inter text-sm font-semibold text-[var(--color-text-secondary)]">
            Камеры
          </p>
          <p className="mt-3 text-4xl font-extrabold text-[var(--color-primary)]">
            5
          </p>
          <p className="mt-2 font-inter text-sm text-[var(--color-text-secondary)]">
            подключены к карте
          </p>
        </div>

        <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
          <p className="font-inter text-sm font-semibold text-[var(--color-text-secondary)]">
            Пользователи
          </p>
          <p className="mt-3 text-4xl font-extrabold text-[var(--color-primary)]">
            —
          </p>
          <p className="mt-2 font-inter text-sm text-[var(--color-text-secondary)]">
            список появится позже
          </p>
        </div>

        <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
          <p className="font-inter text-sm font-semibold text-[var(--color-text-secondary)]">
            Потоки
          </p>
          <p className="mt-3 text-4xl font-extrabold text-green-600">
            Live
          </p>
          <p className="mt-2 font-inter text-sm text-[var(--color-text-secondary)]">
            WebRTC / stream-service
          </p>
        </div>

        <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
          <p className="font-inter text-sm font-semibold text-[var(--color-text-secondary)]">
            API Gateway
          </p>
          <p className="mt-3 text-4xl font-extrabold text-[var(--color-primary)]">
            OK
          </p>
          <p className="mt-2 font-inter text-sm text-[var(--color-text-secondary)]">
            базовая проверка
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-[36px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
        <h2 className="text-2xl font-extrabold">
          Быстрые действия
        </h2>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <button className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-5 py-4 text-left text-sm font-bold transition hover:scale-[1.01] hover:text-[var(--color-primary)]">
            Добавить камеру
          </button>

          <button className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-5 py-4 text-left text-sm font-bold transition hover:scale-[1.01] hover:text-[var(--color-primary)]">
            Проверить сервисы
          </button>

          <button className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-5 py-4 text-left text-sm font-bold transition hover:scale-[1.01] hover:text-[var(--color-primary)]">
            Посмотреть пользователей
          </button>
        </div>
      </div>
    </section>
  );
}