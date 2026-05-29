<div align="center">
<p align="center">
  <img src="./docs/assets/logo-dark.png" alt="Logo" width="300">
</p>

### Интерактивная карта публичных IP-камер с live-видеопотоками в браузере

<p>
  <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Backend-FastAPI%20%26%20NestJS-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL%20%26%20PostGIS-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Streaming-WebRTC%20%2F%20HLS-FF6B00?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Media-MediaMTX-222222?style=for-the-badge" />
</p>

**ОКОГИД** — это веб-платформа, где пользователь открывает красивую интерактивную карту, выбирает точку с IP-камерой и смотрит live-видеопоток прямо в браузере.

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
| **Stream Service** | Получение RTSP-потока и отдача WebRTC/HLS в браузер |
| **Probe Worker** | Проверка камер, snapshot, online/offline-статусы |
| **Geo Service** | Первичное приближение на интерактивной карте на локацию пользователя |
| **Api-Gateway** | Единая точка входа для всех клиентских запросов |

---

## 🛠️ Технологический стек

### Frontend

- React & Vite
- TypeScript
- Leaflet
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
- K8S

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
9. Браузер открывает live-видеопоток через WebRTC или HLS.

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

<div align="center">

## ОКОГИД

**Красивые карты. Живые города. Безопасные видеопотоки.**

</div>