export function AdminPage() {
  return (
    <section className="bg-[var(--color-bg)] px-4 py-10 text-[var(--color-text-primary)] md:px-8 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] shadow-sm backdrop-blur-xl">
          Только для администраторов
        </div>

        <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-6xl">
          Админ панель
        </h1>

        <p className="mt-4 max-w-2xl font-inter text-base leading-7 text-[var(--color-text-secondary)]">
          Здесь позже будет управление камерами, пользователями, категориями,
          потоками и настройками сервиса.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
            <h2 className="text-xl font-extrabold">Камеры</h2>
            <p className="mt-3 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
              Добавление, редактирование и отключение камер.
            </p>
          </div>

          <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
            <h2 className="text-xl font-extrabold">Пользователи</h2>
            <p className="mt-3 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
              Управление аккаунтами, ролями и доступами.
            </p>
          </div>

          <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
            <h2 className="text-xl font-extrabold">Потоки</h2>
            <p className="mt-3 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
              Проверка состояния трансляций и stream-сервисов.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}