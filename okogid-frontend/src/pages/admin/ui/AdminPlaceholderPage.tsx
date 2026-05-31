type AdminPlaceholderPageProps = {
  title: string;
  description: string;
};

export function AdminPlaceholderPage({
  title,
  description,
}: AdminPlaceholderPageProps) {
  return (
    <section>
      <div className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] shadow-sm backdrop-blur-xl">
        Раздел админки
      </div>

      <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-6xl">
        {title}
      </h1>

      <p className="mt-4 max-w-2xl font-inter text-base leading-7 text-[var(--color-text-secondary)]">
        {description}
      </p>

      <div className="mt-8 rounded-[36px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
        <p className="font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
          Пока здесь заглушка. Позже подключим реальные API, таблицы, формы,
          фильтры и действия администратора.
        </p>
      </div>
    </section>
  );
}