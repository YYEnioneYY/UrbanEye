import { Link } from 'react-router';

export function HomePage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl flex-col justify-center px-6 py-20">
      <div className="max-w-3xl">
        <div className="mb-6 inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm">
          Онлайн-экскурсии по городам через камеры
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-[#111827] md:text-7xl">
          Смотри город так, будто ты уже там
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
          Интерактивная карта с IP-камерами, популярными местами и живыми
          онлайн-экскурсиями по городам.
        </p>

        <div className="mt-10 flex gap-4">
          <Link
            to="/map"
            className="rounded-2xl bg-[#FFD21E] px-6 py-3 font-semibold text-black shadow-sm transition hover:scale-[1.02]"
          >
            Открыть карту
          </Link>

          <button className="rounded-2xl border border-black/10 bg-white px-6 py-3 font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50">
            Узнать о проекте
          </button>
        </div>
      </div>
    </section>
  );
}