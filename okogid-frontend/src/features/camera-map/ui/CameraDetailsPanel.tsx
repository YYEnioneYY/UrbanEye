import type { Camera } from '../../../entities/camera/model/types';

type CameraDetailsPanelProps = {
  camera: Camera | null;
  onClose: () => void;
};

function getStatusLabel(status: Camera['status']) {
  if (status === 'online') return 'Онлайн';
  if (status === 'offline') return 'Офлайн';
  return 'Обслуживание';
}

function getStatusClassName(status: Camera['status']) {
  if (status === 'online') {
    return 'bg-green-500/10 text-green-700 ring-green-500/20';
  }

  if (status === 'offline') {
    return 'bg-red-500/10 text-red-700 ring-red-500/20';
  }

  return 'bg-yellow-500/10 text-yellow-700 ring-yellow-500/20';
}

export function CameraDetailsPanel({
  camera,
  onClose,
}: CameraDetailsPanelProps) {
  const isOpen = Boolean(camera);

  return (
    <aside
      className={[
        'absolute right-0 top-0 z-30 h-full w-full max-w-[460px]',
        'border-l border-black/10 bg-white/95 shadow-2xl backdrop-blur-xl',
        'transition-transform duration-300 ease-out',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      ].join(' ')}
    >
      {camera && (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between border-b border-black/10 px-6 py-5">
            <div>
              <p className="text-sm font-medium text-gray-500">Камера</p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0F1318]">
                {camera.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-xl text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-black"
              aria-label="Закрыть карточку камеры"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="overflow-hidden rounded-3xl border border-black/10 bg-[#F6F8FB]">
              {camera.previewUrl ? (
                <img
                  src={camera.previewUrl}
                  alt={camera.title}
                  className="h-56 w-full object-cover"
                />
              ) : (
                <div className="flex h-56 w-full items-center justify-center bg-gradient-to-br from-[#F6F8FB] to-[#E6E9EF]">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FFD21E] shadow-lg">
                    <div className="h-8 w-8 rounded-full bg-[#0F1318] shadow-inner" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span
                className={[
                  'inline-flex rounded-full px-3 py-1 text-sm font-bold ring-1',
                  getStatusClassName(camera.status),
                ].join(' ')}
              >
                {getStatusLabel(camera.status)}
              </span>

              <span className="rounded-full bg-black/5 px-3 py-1 text-sm font-medium text-gray-600">
                {camera.latitude.toFixed(4)}, {camera.longitude.toFixed(4)}
              </span>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400">
                Описание
              </h3>

              <p className="mt-3 text-base leading-7 text-gray-700">
                {camera.description ||
                  'Описание камеры пока не добавлено. Позже здесь будет информация о месте, ракурсе камеры и доступных онлайн-экскурсиях.'}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase text-gray-400">
                  Тип
                </p>
                <p className="mt-1 font-bold text-[#0F1318]">IP-камера</p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase text-gray-400">
                  Поток
                </p>
                <p className="mt-1 font-bold text-[#0F1318]">
                  {camera.streamUrl ? 'Доступен' : 'Скоро'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-black/10 bg-white px-6 py-5">
            <button
              type="button"
              disabled={camera.status !== 'online'}
              className="w-full rounded-2xl bg-[#FFD21E] px-5 py-4 font-bold text-[#0F1318] shadow-sm transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:hover:scale-100"
            >
              Смотреть камеру
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}