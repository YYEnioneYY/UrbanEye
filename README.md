<div align="center">

# 🗺️ UrbanEye

### Интерактивная карта публичных IP-камер с live-видеопотоками в браузере

<p>
  <img src="https://img.shields.io/badge/Frontend-React%20%2F%20Next.js-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Database-PostGIS-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Streaming-WebRTC%20%2F%20HLS-FF6B00?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Media-MediaMTX-222222?style=for-the-badge" />
</p>

**UrbanEye** — это веб-платформа, где пользователь открывает красивую интерактивную карту, выбирает точку с IP-камерой и смотрит live-видеопоток прямо в браузере.

Проект подходит для городских трансляций, онлайн-экскурсий, туристических маршрутов, наблюдения за достопримечательностями и других публичных сценариев.

</div>

---

## ✨ Возможности

- 🗺️ интерактивная карта с IP-камерами;
- 📍 загрузка камер по текущей области карты;
- 🎥 просмотр live-видео в браузере;
- 🔐 скрытие реальных RTSP/ONVIF-доступов от frontend;
- ⚡ WebRTC для низкой задержки;
- 📡 HLS / LL-HLS для массового просмотра;
- 🟢 статусы камер: `online`, `offline`, `maintenance`;
- 🖼️ preview-изображения камер;
- 🧭 основа для маршрутов и онлайн-экскурсий;
- 📊 готовность к мониторингу, аналитике и масштабированию.

---

## 🧠 Идея проекта

Большинство IP-камер отдают поток через **RTSP** или **ONVIF**.  
Браузер не умеет напрямую воспроизводить такие потоки, поэтому между камерой и пользователем нужен отдельный media layer.

```text
IP Camera / RTSP / ONVIF
        ↓
Media Gateway
        ↓
WebRTC / HLS / LL-HLS
        ↓
Browser Player
        ↓
React Map UI
```

Главная задача проекта:

```text
Карта → Клик по камере → Live-видео в браузере
```

---

## 🧩 Основные модули

| Модуль | Ответственность |
|---|---|
| **Frontend** | Карта, маркеры, карточки камер, видеоплеер |
| **Auth** | Пользователи, роли, JWT, права доступа |
| **Camera Service** | Камеры, координаты, статусы, категории, bbox-запросы |
| **Stream Service** | Playback-сессии, временные ссылки, выбор WebRTC/HLS |
| **Probe Worker** | Проверка камер, snapshot, online/offline-статусы |
| **Media Gateway** | Получение RTSP-потока и отдача WebRTC/HLS в браузер |
| **Admin** | Управление камерами, просмотр ошибок, модерация |

---

## 🛠️ Технологический стек

### Frontend

- React / Next.js / Vite
- TypeScript
- Leaflet или MapLibre
- hls.js
- WebRTC player
- Tailwind CSS

### Backend

- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL + PostGIS
- Redis
- Celery / RQ / Dramatiq

### Media Layer

- MediaMTX
- FFmpeg
- GStreamer при необходимости

### Infrastructure

- Docker
- Docker Compose
- Nginx / Traefik
- Prometheus
- Grafana
- S3 / MinIO для preview и записей

---

## 🚦 Главный пользовательский сценарий

1. Пользователь открывает карту.
2. Frontend запрашивает камеры по текущему `bbox`.
3. Backend возвращает только камеры в видимой области карты.
4. Пользователь кликает по камере.
5. Открывается карточка камеры.
6. Пользователь нажимает **Смотреть**.
7. Backend проверяет права доступа.
8. Stream Service создает временный playback URL.
9. Media Gateway подключается к IP-камере.
10. Браузер открывает live-видеопоток через WebRTC или HLS.

---

## 🔐 Безопасность

> Frontend никогда не должен получать прямой RTSP URL, логин или пароль камеры.

Все чувствительные данные остаются только на backend/media layer.

```text
❌ Frontend → IP Camera
✅ Frontend → Backend → Stream Service → Media Gateway → IP Camera
```

Что важно:

- RTSP/ONVIF-доступы хранятся в зашифрованном виде;
- public API не возвращает секретные поля;
- playback URL имеет ограниченное время жизни;
- запуск потоков защищен rate limit;
- admin-действия логируются;
- пользователь не имеет прямого доступа к сети камер.

---

## 📦 MVP

Первая версия проекта должна быть простой, но рабочей.

### В MVP входит

- карта с камерами;
- загрузка камер по `bbox`;
- карточка камеры;
- запуск live-потока;
- HLS/WebRTC playback;
- Camera CRUD для администратора;
- проверка RTSP-потока;
- статусы `online/offline`;
- MediaMTX как media gateway;
- Docker Compose для локального запуска.

### В MVP не входит

- запись архива;
- PTZ-управление;
- мобильное приложение;
- платежи;
- чат;
- сложная аналитика;
- AI-распознавание;
- собственный видеосервер с нуля.

---

<div align="center">

## UrbanEye

**Красивые карты. Живые города. Безопасные видеопотоки.**

</div>