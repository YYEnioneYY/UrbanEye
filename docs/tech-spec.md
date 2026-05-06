# Интерактивная карта с IP-камерами и просмотром видеопотока в браузере

> **Цель проекта:** разработать масштабируемую веб-платформу, где пользователь открывает интерактивную карту, видит точки с IP-камерами, кликает по камере и смотрит live-видеопоток прямо в браузере.

Проект подходит для:

- онлайн-экскурсий;
- городских трансляций;
- туристических маршрутов;
- наблюдения за достопримечательностями;
- публичных камер на интересных местах;
- сервисов мониторинга и визуального присутствия.

---

## 1. Общая идея

Пользователь открывает веб-сервис с красивой интерактивной картой. На карте отображаются камеры в виде точек или кастомных маркеров. При клике по камере открывается карточка с описанием, статусом, превью и кнопкой **«Смотреть»**. После нажатия пользователь видит live-видеопоток в браузере.

Главный сценарий первой версии:

```text
Карта → Клик по камере → Карточка → Смотреть → Live stream в браузере
```

---

## 2. Ключевая техническая проблема

IP-камеры чаще всего отдают поток через:

- **RTSP**;
- **ONVIF**;
- иногда внешний **HLS/WebRTC**;
- реже HTTP/MJPEG или vendor-specific API.

Браузеру нельзя просто передать внутренний RTSP-адрес камеры и ожидать нормального воспроизведения. RTSP не является стандартным браузерным форматом воспроизведения.

Поэтому нужна промежуточная прослойка — **media gateway / streaming server**.

```text
IP Camera / RTSP / ONVIF
        ↓
Media Gateway / Streaming Server
        ↓
WebRTC или HLS / LL-HLS
        ↓
Browser Player
        ↓
React UI + Map
```

---

## 3. Рекомендуемое media-решение

В качестве media gateway можно использовать **MediaMTX**.

MediaMTX может:

- читать RTSP-потоки с камер;
- отдавать потоки через WebRTC;
- отдавать потоки через HLS / LL-HLS;
- работать с несколькими stream path;
- автоматически конвертировать потоки между протоколами;
- поддерживать JWT/HTTP-аутентификацию;
- поддерживать запись;
- отдавать Prometheus-метрики;
- использоваться в MVP через Docker Compose;
- масштабироваться в продакшене как отдельный media-layer.

Для работы с IP-камерами можно ориентироваться на **ONVIF Profile S**. Он предназначен для IP-видеосистем, видеостриминга, настройки потоков, а также может покрывать PTZ, аудио и multicast, если устройство это поддерживает.

---

## 4. Режимы воспроизведения в браузере

| Режим | Когда использовать | Плюсы | Минусы |
|---|---|---|---|
| **WebRTC** | Онлайн-экскурсии, интерактивность, низкая задержка | Минимальная задержка, браузерная поддержка, real-time | Сложнее масштабировать на большое количество зрителей |
| **HLS / LL-HLS** | Массовый просмотр, публичные городские трансляции | Проще масштабировать через CDN, стабильнее для многих зрителей | Задержка выше, чем у WebRTC |

Рекомендуемая логика:

```text
Если нужна низкая задержка → WebRTC
Если много зрителей → HLS / LL-HLS
Если WebRTC не работает → fallback на HLS
```

---

## 5. Рекомендуемый стек

### Frontend

- React / Next.js / Vite;
- TypeScript;
- Leaflet или MapLibre;
- hls.js;
- WebRTC player;
- Zustand / Redux Toolkit / TanStack Query при необходимости;
- Tailwind CSS для интерфейса.

### Backend

- Python;
- FastAPI;
- PostgreSQL + PostGIS;
- Redis;
- Celery / RQ / Dramatiq для фоновых задач;
- Alembic для миграций;
- JWT/OAuth для авторизации.

### Media Layer

- MediaMTX;
- FFmpeg / GStreamer при необходимости;
- отдельные media nodes для масштабирования.

### Infrastructure

- Docker;
- Docker Compose для MVP;
- Nginx / Traefik;
- Kubernetes для продакшена при росте нагрузки;
- Prometheus + Grafana;
- S3-compatible storage для превью и записей, если они понадобятся.

---

## 6. Архитектура системы

```mermaid
flowchart LR
    U[User Browser] --> FE[React Frontend]
    FE --> API[FastAPI Backend]
    FE --> PLAYER[Browser Player]

    API --> DB[(PostgreSQL + PostGIS)]
    API --> REDIS[(Redis)]
    API --> MEDIA[MediaMTX]

    WORKER[Camera Monitoring Worker] --> DB
    WORKER --> REDIS
    WORKER --> MEDIA
    WORKER --> CAM[IP Cameras]

    MEDIA --> CAM
    MEDIA --> PLAYER

    PROM[Prometheus] --> API
    PROM --> MEDIA
    GRAF[Grafana] --> PROM
```


---

# Микросервисная архитектура и план backend-разработки

## 7.1. Главная идея микросервисов

Проект можно спроектировать как набор независимых сервисов, но **не нужно сразу физически создавать 15 микросервисов**. Для MVP лучше начать с модульного backend-приложения и нескольких отдельных инфраструктурных сервисов.

Правильный путь:

```text
MVP: один backend-api с модулями + worker + MediaMTX
        ↓
Рост нагрузки: выделяем Auth, Camera, Stream, Realtime
        ↓
Продакшен: отдельные media nodes, analytics, notifications, snapshot, tour service
```

Ключевой принцип:

> Сначала доказываем основной сценарий: карта → камера → безопасный playback URL → live video в браузере. Только после этого дробим систему на отдельные микросервисы.

---

## 7.2. Целевая схема микросервисов

```text
                         ┌────────────────────┐
                         │      Frontend       │
                         │ React / Next.js     │
                         └─────────┬──────────┘
                                   │
                         ┌─────────▼──────────┐
                         │  API Gateway / BFF  │
                         │ FastAPI / NestJS    │
                         └─────────┬──────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
┌───────▼────────┐       ┌─────────▼────────┐       ┌─────────▼────────┐
│  Auth Service  │       │ Camera Service   │       │   Map Service    │
│ users / roles  │       │ cameras / coords │       │ map data / bbox  │
└────────────────┘       └─────────┬────────┘       └──────────────────┘
                                   │
                         ┌─────────▼────────┐
                         │ Stream Service   │
                         │ playback control │
                         └─────────┬────────┘
                                   │
                         ┌─────────▼────────┐
                         │  Media Gateway   │
                         │ RTSP → WebRTC/HLS│
                         └─────────┬────────┘
                                   │
                         ┌─────────▼────────┐
                         │    IP Cameras    │
                         │   RTSP / ONVIF   │
                         └──────────────────┘
```

Целевая архитектура может выглядеть так:

```text
frontend
api-gateway
auth-service
camera-service
stream-service
probe-service
media-gateway-nodes
tour-service
realtime-service
snapshot-service
notification-service
analytics-service
admin-service
```

Но стартовая MVP-архитектура должна быть проще:

```text
frontend
api-service
worker-probe
mediamtx
postgres
redis
nginx
```

Где `api-service` внутри содержит модули:

```text
auth
camera
stream
admin
tour
```

Такой подход позволяет быстро начать разработку, не утонуть в DevOps и при этом оставить возможность потом разнести модули в настоящие микросервисы.

---

## 7.3. Минимальная архитектура для старта

```text
                 ┌──────────────┐
                 │   Frontend   │
                 └──────┬───────┘
                        │
                 ┌──────▼───────┐
                 │ API Service  │
                 │ FastAPI      │
                 │              │
                 │ auth         │
                 │ camera       │
                 │ stream       │
                 │ admin        │
                 └──────┬───────┘
                        │
        ┌───────────────┼────────────────┐
        │               │                │
┌───────▼──────┐ ┌──────▼──────┐ ┌───────▼──────┐
│ PostgreSQL   │ │ Redis       │ │ MediaMTX     │
│ PostGIS      │ │ Events      │ │ RTSP→HLS/RTC │
└──────────────┘ └─────────────┘ └───────┬──────┘
                                          │
                                  ┌───────▼──────┐
                                  │ IP Cameras   │
                                  └──────────────┘
```

Физически в Docker Compose на MVP достаточно поднять:

| Сервис | Назначение |
|---|---|
| `frontend` | React / Next.js приложение с картой и плеером |
| `api-service` | Основной FastAPI backend: auth, camera, stream, admin |
| `worker-probe` | Фоновая проверка камер и генерация превью |
| `mediamtx` | Media gateway для RTSP → WebRTC/HLS |
| `postgres` | PostgreSQL + PostGIS для камер, пользователей, сессий |
| `redis` | Очереди, события, rate limit, временные состояния |
| `nginx` | Reverse proxy, HTTPS, маршрутизация запросов |

---

## 7.4. Основные микросервисы

### 1. API Gateway / BFF

Это входная точка для frontend. Он скрывает внутреннюю структуру backend и дает frontend удобный API.

**Ответственность:**

- принимает все запросы от frontend;
- проверяет авторизацию;
- проксирует запросы в нужные сервисы;
- собирает данные из нескольких сервисов в один ответ;
- скрывает внутренние адреса сервисов;
- применяет rate limit и базовые security rules.

**Технологии:**

- FastAPI, если вся backend-команда работает на Python;
- NestJS, если нужен BFF ближе к frontend/TypeScript-экосистеме.

**Public API через Gateway:**

```http
GET  /api/cameras
GET  /api/cameras/{id}
POST /api/cameras/{id}/play
GET  /api/routes
GET  /api/me
```

Пример сценария:

```text
Frontend вызывает POST /api/cameras/123/play

API Gateway:
1. Проверяет JWT пользователя.
2. Запрашивает Camera Service: существует ли камера и публичная ли она.
3. Запрашивает Stream Service: можно ли запустить поток.
4. Возвращает frontend временный playback URL.
```

В MVP API Gateway можно не выделять отдельно. Его роль может выполнять основной `api-service`.

---

### 2. Auth Service

Сервис авторизации, пользователей и ролей.

**Ответственность:**

- регистрация;
- логин;
- JWT;
- refresh tokens;
- роли пользователей;
- права доступа;
- пользовательские сессии;
- администраторы, гиды, обычные пользователи и гости.

**Роли:**

| Роль | Возможности |
|---|---|
| `guest` | Может смотреть публичные камеры |
| `user` | Может смотреть доступные камеры и маршруты |
| `guide` | Может вести онлайн-экскурсию |
| `admin` | Может управлять камерами, маршрутами и пользователями |

**База сервиса:**

```text
auth_db
```

Таблицы:

```text
users
roles
permissions
refresh_tokens
sessions
```

**API:**

```http
POST /auth/login
POST /auth/register
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

В MVP Auth можно держать внутри `api-service`, но сразу делать отдельный модуль `app/modules/auth`.

---

### 3. Camera Service

Это один из главных сервисов проекта. Он хранит информацию о камерах, координатах, статусах и технических параметрах подключения.

**Ответственность:**

- хранение камер;
- координаты камер;
- названия и описания;
- статусы камер;
- категории камер;
- привязка к городам и маршрутам;
- хранение зашифрованных RTSP/ONVIF-доступов;
- выдача камер по текущей области карты;
- внутренний endpoint для получения stream-конфига.

Важно:

> Camera Service не стримит видео. Он только знает, что камера существует, где она находится и как к ней можно подключиться на уровне backend/media layer.

**База сервиса:**

```text
camera_db
PostgreSQL + PostGIS
```

Таблицы:

```text
cameras
camera_categories
camera_status_history
camera_credentials
camera_locations
camera_tags
```

Пример публичной модели камеры:

```json
{
  "id": "cam_123",
  "title": "Дворцовая площадь",
  "description": "Камера рядом с главным туристическим местом",
  "latitude": 59.9398,
  "longitude": 30.3146,
  "status": "online",
  "category": "tourism",
  "is_public": true,
  "preview_url": "https://cdn.example.com/previews/cam_123.jpg"
}
```

**Public/Internal API:**

```http
GET    /cameras?bbox=minLng,minLat,maxLng,maxLat
GET    /cameras/{id}
POST   /cameras
PATCH  /cameras/{id}
DELETE /cameras/{id}
GET    /cameras/{id}/internal-stream-config
```

Endpoint `/internal-stream-config` должен быть доступен только внутренним сервисам.

Пример внутреннего ответа:

```json
{
  "camera_id": "cam_123",
  "rtsp_url": "rtsp://login:password@10.0.0.15:554/stream1",
  "onvif_host": "10.0.0.15",
  "onvif_port": 8899
}
```

Frontend **никогда** не должен получать такой ответ.

---

### 4. Camera Probe / Health Service

Сервис фоновой проверки камер.

**Ответственность:**

- проверяет, жива ли камера;
- проверяет, доступен ли RTSP;
- проверяет ONVIF, если он указан;
- получает тестовый кадр;
- обновляет статус камеры;
- фиксирует ошибки;
- следит за задержками;
- публикует события об изменении состояния.

**Технологии:**

- Python;
- Celery / RQ / Dramatiq;
- FFmpeg / OpenCV;
- Redis Streams для событий;
- FastAPI для internal API, если нужен ручной запуск проверок.

**Что делает по расписанию:**

```text
1. Берет список активных камер.
2. Пробует подключиться к RTSP/ONVIF.
3. Пробует получить кадр.
4. Измеряет время ответа.
5. Обновляет статус и last_seen_at.
6. Сохраняет ошибку, если камера недоступна.
7. Публикует событие camera.status_changed, если статус изменился.
```

**Статусы:**

```text
online
offline
maintenance
auth_error
timeout
stream_error
unknown
```

**API:**

```http
POST /probe/cameras/{id}/check
POST /probe/cameras/{id}/snapshot
GET  /probe/cameras/{id}/last-result
```

Пример события:

```json
{
  "event": "camera.status_changed",
  "camera_id": "cam_123",
  "old_status": "offline",
  "new_status": "online"
}
```

В MVP это должен быть отдельный процесс `worker-probe`, но он может использовать ту же кодовую базу, что и `api-service`.

---

### 5. Stream Service

Сервис управления запуском видеопотоков.

Он не обязан сам конвертировать видео. Его задача — управлять доступом к просмотру и взаимодействовать с media gateway.

**Ответственность:**

- создание playback-сессии;
- проверка прав доступа;
- выбор протокола: WebRTC / HLS / LL-HLS;
- выбор media node;
- генерация временного URL;
- учет активных зрителей;
- запуск on-demand потока;
- остановка неиспользуемых потоков;
- защита от прямого доступа к RTSP.

**База сервиса:**

```text
stream_db
```

Таблицы:

```text
stream_sessions
stream_paths
viewer_sessions
media_nodes
stream_tokens
```

**API:**

```http
POST /streams/play
POST /streams/stop
GET  /streams/{camera_id}/status
GET  /streams/nodes
```

Пример запроса:

```json
{
  "camera_id": "cam_123",
  "user_id": "user_456",
  "preferred_protocol": "webrtc"
}
```

Пример ответа:

```json
{
  "camera_id": "cam_123",
  "protocol": "webrtc",
  "playback_url": "https://stream-1.example.com/cam_123/webrtc?token=abc",
  "expires_in": 300
}
```

**Важная логика:**

```text
Если камера популярная:
  держим поток always-on.

Если камера редко используется:
  запускаем поток только когда кто-то нажал "Смотреть".

Если зрителей нет:
  через 30-60 секунд останавливаем поток.
```

---

### 6. Media Gateway Service

Это media-слой. Его лучше не писать с нуля.

**Ответственность:**

- подключение к RTSP IP-камер;
- преобразование RTSP в WebRTC;
- преобразование RTSP в HLS/LL-HLS;
- раздача потока браузерам;
- поддержка нескольких зрителей;
- auth/token access для stream paths;
- метрики по потокам.

**Возможные технологии:**

- MediaMTX;
- SRS;
- Janus;
- GStreamer;
- FFmpeg.

Для MVP рекомендуется:

```text
MediaMTX
```

Почему media gateway должен быть отдельным сервисом:

- видео потребляет много CPU;
- видео потребляет много RAM;
- видео потребляет много network bandwidth;
- при транскодинге может понадобиться GPU;
- API и media layer масштабируются по-разному.

Масштабирование:

```text
media-node-1
media-node-2
media-node-3
```

Stream Service выбирает, на какую media-ноду отправить пользователя.

Пример распределения:

```text
cam_123 → media-node-1
cam_456 → media-node-2
cam_789 → media-node-1
```

---

### 7. Map Service

Сервис карты и геоданных.

**Ответственность:**

- работа с геоданными;
- выдача камер по bbox;
- кластеризация камер;
- геозоны;
- маршруты экскурсий на карте;
- места интереса;
- поиск по карте.

В MVP Map Service можно не выделять отдельно. Bbox-запросы и координаты можно держать в Camera Service.

**API будущего Map Service:**

```http
GET /map/cameras?bbox=...
GET /map/clusters?bbox=...&zoom=...
GET /map/pois?bbox=...
GET /map/search?q=...
```

Пример ответа кластеров:

```json
{
  "clusters": [
    {
      "lat": 59.93,
      "lng": 30.31,
      "count": 24
    }
  ]
}
```

---

### 8. Tour Service

Сервис онлайн-экскурсий и маршрутов.

**Ответственность:**

- создание маршрутов;
- привязка камер к маршруту;
- очередность камер;
- описание точек маршрута;
- сценарий экскурсии;
- режим ведущего;
- управление текущей камерой экскурсии.

**Сущности:**

```text
tour
tour_step
tour_session
tour_participant
```

Пример маршрута:

```json
{
  "id": "tour_spb_center",
  "title": "Прогулка по центру Петербурга",
  "steps": [
    {
      "camera_id": "cam_1",
      "title": "Дворцовая площадь",
      "duration_seconds": 180
    },
    {
      "camera_id": "cam_2",
      "title": "Невский проспект",
      "duration_seconds": 240
    }
  ]
}
```

**API:**

```http
GET   /tours
GET   /tours/{id}
POST  /tours
PATCH /tours/{id}
POST  /tours/{id}/start
POST  /tours/sessions/{session_id}/next
POST  /tours/sessions/{session_id}/set-camera
```

В MVP Tour Service можно держать как модуль внутри `api-service` или вообще отложить до второго этапа.

---

### 9. Realtime Service

Сервис WebSocket-событий.

Он нужен для онлайн-экскурсий, live-статусов и синхронизации интерфейса.

**Ответственность:**

- WebSocket-подключения;
- рассылка статусов камер;
- синхронизация онлайн-экскурсии;
- уведомление frontend о смене камеры;
- уведомление frontend о недоступности потока.

Пример событий:

```json
{
  "type": "camera.status_changed",
  "camera_id": "cam_123",
  "status": "offline"
}
```

```json
{
  "type": "tour.camera_changed",
  "tour_session_id": "tour_session_1",
  "camera_id": "cam_456"
}
```

**API / WS:**

```http
GET /ws
GET /ws/tours/{tour_session_id}
GET /ws/cameras
```

**Технологии:**

- FastAPI WebSocket;
- Node.js + Socket.IO;
- Redis Pub/Sub или Redis Streams для доставки событий между сервисами.

Для большого количества WebSocket-подключений удобно использовать Node.js, но для MVP можно начать с FastAPI WebSocket.

---

### 10. Preview / Snapshot Service

Сервис превьюшек камер.

**Ответственность:**

- периодически получать кадр с камеры;
- сохранять preview image;
- отдавать frontend красивую картинку до запуска видео;
- обновлять картинку при изменении;
- не нагружать основной API FFmpeg/OpenCV-задачами.

**Хранилище:**

```text
S3 / MinIO / local object storage
```

**API:**

```http
POST /snapshots/cameras/{id}/generate
GET  /snapshots/cameras/{id}/latest
```

Пример ответа:

```json
{
  "camera_id": "cam_123",
  "preview_url": "https://cdn.example.com/previews/cam_123.jpg",
  "generated_at": "2026-05-06T12:00:00Z"
}
```

В MVP генерацию snapshot можно включить в `worker-probe`, а отдельный сервис выделить позже.

---

### 11. Admin Service

Сервис административной панели.

В MVP admin-функции можно держать внутри Camera Service и Auth Service. В целевой архитектуре лучше выделить Admin Service как агрегатор административных данных.

**Ответственность:**

- админка;
- управление камерами;
- управление пользователями;
- управление маршрутами;
- просмотр ошибок камер;
- просмотр активных потоков;
- модерация публичных камер;
- аудит действий.

**API:**

```http
GET   /admin/dashboard
GET   /admin/cameras
POST  /admin/cameras
PATCH /admin/cameras/{id}
GET   /admin/streams
GET   /admin/errors
GET   /admin/audit-logs
```

Admin Service не должен хранить все данные сам. Он собирает данные из:

- Camera Service;
- Stream Service;
- Auth Service;
- Probe Service;
- Tour Service.

---

### 12. Notification Service

Сервис уведомлений.

**Ответственность:**

- уведомлять администратора, что камера упала;
- уведомлять, что поток недоступен;
- уведомлять, что media-node перегружен;
- отправлять email / Telegram / Slack / webhook.

Пример события:

```json
{
  "event": "camera.offline",
  "camera_id": "cam_123",
  "reason": "rtsp_timeout"
}
```

**Каналы:**

- Email;
- Telegram bot;
- Slack;
- Webhook.

**API:**

```http
POST /notifications/send
POST /notifications/rules
GET  /notifications/history
```

---

### 13. Analytics Service

Сервис аналитики.

**Ответственность:**

- сколько пользователей смотрело камеры;
- какие камеры популярные;
- средняя длительность просмотра;
- пики нагрузки;
- популярные маршруты;
- ошибки запуска потоков;
- нагрузка по media nodes.

**События, которые слушает Analytics Service:**

```text
stream.started
stream.stopped
camera.opened
tour.started
tour.finished
user.joined_tour
camera.status_changed
```

**Таблицы:**

```text
events
stream_view_stats
camera_popularity
tour_stats
```

**API:**

```http
GET /analytics/cameras/popular
GET /analytics/streams/active
GET /analytics/tours/{id}
GET /analytics/errors
```

---

### 14. Recording Service, опционально

Этот сервис нужен только если появится архив видео.

**Ответственность:**

- запись потоков;
- нарезка видеофрагментов;
- хранение архива;
- выдача записей;
- очистка старых записей.

В MVP Recording Service не нужен, потому что он резко усложняет проект.

**API:**

```http
POST /recordings/cameras/{id}/start
POST /recordings/cameras/{id}/stop
GET  /recordings/cameras/{id}
```

---

## 7.5. Итоговый список сервисов по приоритету

### Обязательные для MVP

| № | Сервис | Почему нужен |
|---|---|---|
| 1 | Frontend | Карта, карточки камер, видеоплеер |
| 2 | API Gateway / API Service | Единая точка входа для frontend |
| 3 | Auth module/service | Роли, JWT, доступы |
| 4 | Camera module/service | Камеры, координаты, bbox, статусы |
| 5 | Stream module/service | Playback URL, stream sessions, доступ к просмотру |
| 6 | Media Gateway Service | RTSP → WebRTC/HLS |
| 7 | Camera Probe / Health Worker | Проверка камер, статусы, превью |

### Желательные после MVP

| № | Сервис | Когда добавлять |
|---|---|---|
| 8 | Realtime Service | Когда нужны live-статусы и экскурсии |
| 9 | Tour Service | Когда появятся маршруты и гиды |
| 10 | Preview / Snapshot Service | Когда генерация превью начнет грузить worker |
| 11 | Admin Service | Когда админка станет сложной |
| 12 | Notification Service | Когда нужны уведомления админам |
| 13 | Analytics Service | Когда нужно измерять популярность и нагрузку |

### Опциональные позже

| № | Сервис | Когда нужен |
|---|---|---|
| 14 | Map Service | Когда потребуется сложная геоаналитика и кластеризация |
| 15 | Recording Service | Когда нужен видеоархив |
| 16 | Billing Service | Когда появятся платные тарифы |
| 17 | CDN / Edge Service | Когда будет массовый HLS-просмотр |

---

## 7.6. Коммуникация между сервисами

### Синхронная коммуникация

Используется, когда ответ нужен прямо сейчас.

Технологии:

- HTTP REST;
- gRPC, если нужна строгая схема и высокая производительность.

Примеры:

```text
API Gateway → Auth Service
API Gateway → Camera Service
API Gateway → Stream Service
Stream Service → Camera Service
Stream Service → Media Gateway
```

Сценарий:

```text
Пользователь нажал "Смотреть".
Gateway спрашивает Stream Service.
Stream Service спрашивает Camera Service.
Stream Service настраивает Media Gateway.
Gateway возвращает playback_url.
```

### Асинхронная коммуникация

Используется для событий, фоновых задач и мониторинга.

Для MVP достаточно:

```text
Redis Streams
```

Позже можно перейти на:

```text
Kafka
RabbitMQ
NATS
```

Примеры событий:

```text
Probe Service   → camera.status_changed
Stream Service  → stream.started
Stream Service  → stream.stopped
Tour Service    → tour.started
Analytics       слушает события
Notification    слушает события
Realtime        слушает события
```

---

## 7.7. Кто какой базой владеет

Правильный микросервисный принцип:

> Каждый сервис владеет своей базой. Другие сервисы не ходят напрямую в чужие таблицы.

Целевая схема:

```text
Auth Service       → auth_db
Camera Service     → camera_db
Stream Service     → stream_db
Tour Service       → tour_db
Analytics Service  → analytics_db
```

Для MVP можно использовать один PostgreSQL, но разные схемы:

```text
auth.users
camera.cameras
stream.sessions
tour.routes
analytics.events
```

Это хороший компромисс: проще разрабатывать на старте, но потом легче разделить сервисы физически.

---

## 7.8. Главный сценарий: пользователь смотрит камеру

```text
1. Пользователь открывает карту.
2. Frontend запрашивает камеры:
   GET /api/cameras?bbox=...

3. API Gateway идет в Camera Service.
4. Camera Service возвращает камеры в области карты.

5. Пользователь кликает на камеру.
6. Frontend вызывает:
   POST /api/cameras/{id}/play

7. API Gateway проверяет пользователя через Auth Service.
8. API Gateway вызывает Stream Service.

9. Stream Service:
   - проверяет права;
   - получает RTSP-конфиг из Camera Service;
   - выбирает media-node;
   - создает временный stream token;
   - активирует поток в Media Gateway.

10. Media Gateway подключается к IP-камере.
11. Stream Service возвращает playback URL.
12. Frontend открывает WebRTC/HLS-плеер.
13. Analytics Service получает событие stream.started.
```

---

## 7.9. Главный сценарий: камера упала

```text
1. Probe Service по расписанию проверяет камеру.
2. Не может получить RTSP-поток.
3. Публикует событие camera.status_changed.
4. Camera Service обновляет статус камеры.
5. Realtime Service отправляет frontend событие по WebSocket.
6. Notification Service уведомляет администратора.
7. На карте камера становится серой или красной.
```

---

## 7.10. С чего начать backend-инженеру

Backend-инженеру не нужно начинать с микросервисов, Kubernetes и сложной схемы деплоя. Начать нужно с ядра продукта.

Главное ядро:

```text
Camera Service + Stream Service + Media Gateway
```

Если эти три части сделаны правильно, всё остальное можно спокойно наращивать.

### Шаг 1. Поднять локальную инфраструктуру

Сначала нужно собрать `docker-compose.yml`:

```yaml
services:
  api-service:
    build: ./backend
    depends_on:
      - postgres
      - redis
      - mediamtx

  worker-probe:
    build: ./backend
    command: python -m app.workers.probe
    depends_on:
      - postgres
      - redis
      - mediamtx

  postgres:
    image: postgis/postgis:16-3.4

  redis:
    image: redis:7

  mediamtx:
    image: bluenviron/mediamtx:latest

  nginx:
    image: nginx:alpine
```

На этом шаге должны заработать:

- PostgreSQL + PostGIS;
- Redis;
- MediaMTX;
- FastAPI healthcheck;
- Alembic migrations;
- `.env.example`.

---

### Шаг 2. Создать backend-структуру проекта

Рекомендуемая структура FastAPI-проекта:

```text
backend/
  app/
    main.py
    core/
      config.py
      security.py
      database.py
      encryption.py
    modules/
      auth/
        models.py
        schemas.py
        router.py
        service.py
      cameras/
        models.py
        schemas.py
        router.py
        service.py
        repository.py
      streams/
        schemas.py
        router.py
        service.py
        mediamtx_client.py
      admin/
        router.py
      health/
        router.py
    workers/
      probe.py
      snapshot.py
    migrations/
  tests/
```

Сначала это один backend, но структура уже похожа на будущие микросервисы. Потом `modules/cameras` можно вынести в `camera-service`, а `modules/streams` — в `stream-service`.

---

### Шаг 3. Сделать базу и модель Camera

Первый настоящий backend-функционал — камера и bbox-запрос.

Нужно сделать:

- таблицу `cameras`;
- поля `title`, `description`, `latitude`, `longitude`, `status`, `category`, `is_public`;
- PostGIS-колонку `location`;
- spatial index;
- Alembic migration;
- seed-данные для 5-10 тестовых камер.

Критичный endpoint:

```http
GET /api/cameras?bbox=minLng,minLat,maxLng,maxLat
```

Пока этот endpoint не работает быстро и стабильно, frontend-карта будет бесполезной.

---

### Шаг 4. Добавить безопасное хранение RTSP/ONVIF

Нельзя хранить RTSP credentials открытым текстом.

Нужно сделать:

- отдельную таблицу `camera_credentials`;
- шифрование `rtsp_url`, `onvif_username`, `onvif_password`;
- запрет на возврат секретных полей в public API;
- internal method для Stream Service.

Public response:

```json
{
  "id": "cam_123",
  "title": "Дворцовая площадь",
  "status": "online",
  "latitude": 59.9398,
  "longitude": 30.3146
}
```

Internal response:

```json
{
  "camera_id": "cam_123",
  "rtsp_url": "rtsp://login:password@10.0.0.15:554/stream1"
}
```

---

### Шаг 5. Проверить MediaMTX вручную

Перед интеграцией с backend нужно отдельно доказать, что MediaMTX может открыть поток.

Минимальная проверка:

```text
1. Поднять MediaMTX.
2. Добавить один RTSP stream path.
3. Открыть HLS/WebRTC URL в браузере.
4. Убедиться, что задержка и стабильность приемлемые.
```

На этом этапе можно использовать тестовый RTSP-поток или одну реальную IP-камеру.

---

### Шаг 6. Реализовать Stream Service

Нужно сделать endpoint:

```http
POST /api/cameras/{camera_id}/play
```

Внутренняя логика:

```text
1. Получить camera_id.
2. Проверить, существует ли камера.
3. Проверить, можно ли пользователю ее смотреть.
4. Получить internal stream config.
5. Создать stream session.
6. Создать временный token.
7. Подготовить stream path в MediaMTX.
8. Вернуть playback_url.
```

Ответ frontend:

```json
{
  "camera_id": "cam_123",
  "protocol": "hls",
  "playback_url": "https://stream.example.com/cam_123/index.m3u8?token=abc",
  "expires_in": 300
}
```

На MVP можно сначала поддержать только HLS, а WebRTC добавить следующим шагом.

---

### Шаг 7. Сделать Probe Worker

После того как камера добавляется и stream запускается, нужен monitoring.

Worker должен:

- брать камеры из базы;
- проверять RTSP;
- получать snapshot;
- обновлять `status`;
- обновлять `last_seen_at`;
- сохранять причину ошибки;
- публиковать событие в Redis Streams.

Первый вариант может быть простым:

```text
каждые 60 секунд проверить 10-50 камер батчем
```

Потом можно добавить приоритеты, backoff и отдельные очереди.

---

### Шаг 8. Добавить Auth и Admin API

На старте достаточно:

- login;
- JWT;
- роль `admin`;
- middleware проверки прав;
- admin CRUD камер;
- audit log действий админа.

Admin endpoints:

```http
POST   /api/admin/cameras
PATCH  /api/admin/cameras/{id}
DELETE /api/admin/cameras/{id}
POST   /api/admin/cameras/{id}/test-connection
POST   /api/admin/cameras/{id}/refresh-preview
```

---

### Шаг 9. Покрыть backend тестами

Минимальный набор тестов:

- bbox возвращает только камеры внутри области;
- public API не возвращает RTSP URL;
- guest может смотреть public camera;
- guest не может смотреть private camera;
- admin может создать камеру;
- play endpoint возвращает временный URL;
- истекший token не работает;
- offline camera не запускает stream;
- probe меняет статус камеры.

---

## 7.11. Задачи для backend-разработчиков

### Backend-разработчик 1: Auth

```text
- users;
- roles;
- JWT;
- refresh tokens;
- middleware проверки прав;
- admin/user/guide roles.
```

### Backend-разработчик 2: Camera Service

```text
- CRUD камер;
- PostgreSQL + PostGIS;
- bbox-запросы;
- категории;
- статусы;
- encrypted RTSP credentials;
- internal endpoint для Stream Service.
```

### Backend-разработчик 3: Stream Service

```text
- POST /streams/play;
- выбор media-node;
- генерация playback URL;
- stream sessions;
- viewer sessions;
- интеграция с MediaMTX;
- временные токены;
- остановка неактивных потоков.
```

### Backend-разработчик 4: Probe Worker

```text
- периодическая проверка камер;
- FFmpeg/OpenCV snapshot;
- обновление статусов;
- история ошибок;
- события camera.status_changed.
```

---

## 7.12. Что нельзя делать

Нельзя делать так:

```text
Frontend → IP Camera
```

И нельзя превращать один backend API в монстра, который одновременно:

```text
- хранит пользователей;
- хранит камеры;
- стримит видео;
- проверяет камеры;
- генерирует превью;
- ведет экскурсии;
- пишет аналитику;
- хранит записи;
- рассылает уведомления.
```

Правильное разделение:

```text
Backend API занимается бизнес-логикой.
Media Gateway занимается видео.
Probe Worker занимается проверкой камер.
Camera/Map Service занимается геоданными.
Stream Service управляет доступом к просмотру.
Redis отвечает за события и временные состояния.
PostgreSQL/PostGIS отвечает за надежное хранение данных и геозапросы.
```

Главное правило проекта:

> Frontend не знает RTSP. Backend не транскодирует видео сам. Media layer занимается потоками. Camera Service и Stream Service управляют доступом, статусами и безопасностью.

---

## 7. Работа с картой

Для карты можно использовать **Leaflet** — open-source JavaScript-библиотеку для интерактивных mobile-friendly карт. Она поддерживает:

- tile layers;
- markers;
- popups;
- tooltips;
- clustering через плагины;
- события карты;
- работу с bbox;
- кастомные иконки.

### Важное замечание по OpenStreetMap

В продакшене нельзя бездумно грузить тайлы напрямую с публичных серверов OpenStreetMap.

Данные OpenStreetMap открытые, но публичные tile-серверы OSM не являются бесплатным SLA/API для сторонних коммерческих или нагруженных продуктов.

Для коммерческого или нагруженного проекта лучше использовать:

- MapTiler;
- Stadia Maps;
- Thunderforest;
- Mapbox;
- self-hosted tiles;
- собственный tile-cache.

---

## 8. Основные сущности

### Camera

| Поле | Описание |
|---|---|
| `id` | UUID камеры |
| `title` | Название камеры |
| `description` | Описание места |
| `latitude` | Широта |
| `longitude` | Долгота |
| `address` | Адрес |
| `city` | Город |
| `country` | Страна |
| `category` | Категория камеры |
| `status` | `online`, `offline`, `maintenance`, `hidden` |
| `stream_type` | `rtsp`, `onvif`, `external_hls`, `external_webrtc` |
| `rtsp_url_encrypted` | Зашифрованный RTSP URL |
| `onvif_host` | ONVIF host |
| `onvif_port` | ONVIF port |
| `onvif_username_encrypted` | Зашифрованный ONVIF username |
| `onvif_password_encrypted` | Зашифрованный ONVIF password |
| `media_path` | Stream path в MediaMTX |
| `preview_image_url` | URL превью |
| `is_public` | Публичная ли камера |
| `is_featured` | Рекомендуемая камера |
| `ptz_supported` | Поддерживает ли PTZ |
| `audio_supported` | Поддерживает ли аудио |
| `created_at` | Дата создания |
| `updated_at` | Дата обновления |
| `last_seen_at` | Последний успешный контакт |

### CameraGroup / Route

Для онлайн-экскурсий и туристических маршрутов.

| Поле | Описание |
|---|---|
| `id` | UUID маршрута |
| `title` | Название маршрута |
| `description` | Описание маршрута |
| `camera_ids` | Список камер маршрута |
| `route_geometry` | Геометрия маршрута |
| `sort_order` | Порядок отображения |
| `is_public` | Публичный ли маршрут |

### StreamSession

| Поле | Описание |
|---|---|
| `id` | UUID сессии |
| `user_id` | ID пользователя, если авторизован |
| `camera_id` | ID камеры |
| `started_at` | Время начала просмотра |
| `ended_at` | Время окончания просмотра |
| `client_ip_hash` | Хеш IP пользователя |
| `protocol` | `webrtc` или `hls` |
| `status` | Статус сессии |

---

## 9. Public API

### Получить камеры в области карты

```http
GET /api/cameras
```

Query params:

| Параметр | Описание |
|---|---|
| `bbox` | `minLng,minLat,maxLng,maxLat` |
| `category` | Фильтр по категории |
| `status` | Например, `online` |
| `limit` | Лимит записей |
| `offset` | Смещение |

Пример:

```http
GET /api/cameras?bbox=30.1,59.8,30.5,60.1&status=online&limit=500
```

---

### Получить подробную информацию по камере

```http
GET /api/cameras/{camera_id}
```

Public API не должен возвращать:

- сырой RTSP URL;
- ONVIF-логин;
- ONVIF-пароль;
- внутренние адреса сети;
- технические credentials.

---

### Создать временную ссылку на просмотр

```http
POST /api/cameras/{camera_id}/play
```

Ответ:

```json
{
  "camera_id": "uuid",
  "protocol": "webrtc",
  "playback_url": "https://stream.example.com/cam-123/webrtc",
  "expires_at": "2026-05-06T14:30:00Z"
}
```

Важно:

> Frontend не должен получать сырой RTSP URL, логин или пароль камеры.

---

### Получить live-статус камеры

```http
GET /api/cameras/{camera_id}/status
```

---

### Получить маршруты

```http
GET /api/routes
GET /api/routes/{route_id}
```

---

## 10. Admin API

```http
POST   /api/admin/cameras
PATCH  /api/admin/cameras/{camera_id}
DELETE /api/admin/cameras/{camera_id}
POST   /api/admin/cameras/{camera_id}/test-connection
POST   /api/admin/cameras/{camera_id}/refresh-preview
```

Admin API должен быть закрыт авторизацией и ролями.

---

# Backend Development

## Epic 1. База данных и модели

### Задачи

- Поднять PostgreSQL + PostGIS.
- Создать таблицы:
  - `cameras`;
  - `camera_groups` / `routes`;
  - `stream_sessions`;
  - `users`;
  - `audit_logs`.
- Добавить spatial index по координатам камер.
- Реализовать выборку камер по `bbox`.
- Настроить миграции через Alembic.

### Критерий готовности

- При движении карты frontend получает только камеры внутри текущей области.
- Запросы остаются быстрыми при тысячах камер.

---

## Epic 2. API управления камерами

### Задачи

- Реализовать CRUD для камер.
- Сохранять RTSP/ONVIF-доступы в зашифрованном виде.
- Не возвращать секретные поля в Public API.
- Добавить проверку камеры:
  - доступность хоста;
  - доступность RTSP;
  - получение тестового кадра;
  - проверка ONVIF-данных, если камера поддерживает ONVIF.
- Добавить статусы:
  - `online`;
  - `offline`;
  - `maintenance`;
  - `hidden`.

### Критерий готовности

- Администратор может добавить камеру, проверить подключение и увидеть ее на карте.
- Публичный пользователь не видит технические доступы к камере.

---

## Epic 3. Интеграция с media gateway

### Задачи

- Поднять MediaMTX отдельным сервисом.
- Настроить stream paths для камер.
- Реализовать backend-сервис, который:
  - принимает `camera_id`;
  - проверяет права пользователя;
  - генерирует временный playback URL;
  - при необходимости создает или активирует stream path в MediaMTX;
  - возвращает frontend ссылку на WebRTC или HLS.
- Сделать режимы:
  - `always-on` для популярных камер;
  - `on-demand` для редких камер.
- Скрыть реальные RTSP URL от пользователей.
- Добавить timeout отключения неиспользуемых потоков.

### Критерий готовности

- Пользователь кликает на камеру, backend выдает безопасную ссылку, браузер открывает видеопоток.
- RTSP-адрес камеры не уходит в браузер.

---

## Epic 4. Мониторинг камер

### Задачи

- Создать worker, который периодически проверяет камеры.
- Проверять:
  - камера доступна;
  - поток читается;
  - последний кадр получен;
  - задержка не превышает порог;
  - ошибка авторизации;
  - камера недоступна.
- Обновлять `last_seen_at`.
- Генерировать preview image.
- Хранить историю ошибок.
- Отдавать статус во frontend.

Redis Streams можно использовать для событий мониторинга, потому что Redis Streams — это append-only структура данных для записи и обработки событий в реальном времени, с consumer groups и стратегиями чтения.

### Критерий готовности

- На карте видно, какие камеры онлайн, оффлайн или в обслуживании.
- Администратор видит причину ошибки.

---

## Epic 5. Авторизация и безопасность

### Роли

| Роль | Возможности |
|---|---|
| `guest` | Смотреть публичные камеры |
| `user` | Смотреть публичные и доступные приватные камеры |
| `guide` | Управлять сценарием онлайн-экскурсии |
| `admin` | Управлять камерами, маршрутами, пользователями и настройками |

### Задачи

- Public камеры доступны всем.
- Private камеры доступны только авторизованным пользователям.
- Admin API закрыт JWT/OAuth.
- RTSP URL, логины и пароли камер хранятся только на backend/media layer.
- Playback URL временные.
- Добавить rate limit на запуск потоков.
- Добавить audit log действий администратора.
- Не давать пользователю прямой доступ в сеть камер.

### Критерий готовности

- Пользователь не может получить пароль камеры или прямой RTSP URL.
- Администраторские действия логируются.

---

# Frontend Development

## Epic 1. Карта

### Задачи

- Поднять React/Next.js или React/Vite проект.
- Подключить карту через Leaflet или MapLibre.
- Реализовать:
  - отображение камер на карте;
  - кастомные красивые маркеры;
  - разные цвета статусов;
  - кластеризацию маркеров;
  - загрузку камер по текущему `bbox`;
  - popup/card камеры по клику.
- Добавить фильтры:
  - город;
  - категория;
  - онлайн/оффлайн;
  - избранные;
  - экскурсионные маршруты.

### Критерий готовности

- Пользователь открывает карту, видит камеры, двигает карту, камеры подгружаются динамически.

---

## Epic 2. Просмотр камеры

### Задачи

- По клику на камеру открывать красивую карточку.
- В карточке показывать:
  - название;
  - описание;
  - preview;
  - статус;
  - кнопку **«Смотреть»**.
- При нажатии **«Смотреть»** вызвать:

```http
POST /api/cameras/{camera_id}/play
```

- Открыть видеоплеер:
  - modal;
  - fullscreen mode;
  - loading state;
  - error state;
  - retry button.
- Поддержать HLS через `hls.js`.
- Поддержать WebRTC player, если backend вернул WebRTC URL.
- Добавить graceful fallback:

```text
WebRTC не работает → попробовать HLS
HLS не работает → показать ошибку и кнопку повтора
```

### Критерий готовности

- Пользователь кликает на камеру и видит live-видео в браузере.
- При ошибке поток не ломает весь интерфейс.

---

## Epic 3. Онлайн-экскурсии

### Задачи

- Сделать страницу маршрута.
- Показывать список камер маршрута.
- Добавить режим **«Экскурсия»**:
  - текущая камера;
  - следующая камера;
  - описание места;
  - кнопка **«Перейти дальше»**;
  - таймлайн маршрута.
- Добавить режим **«Ведущий»** для `guide`-пользователя:
  - гид выбирает камеру;
  - зрители видят выбранную камеру;
  - состояние синхронизируется через WebSocket.

FastAPI поддерживает WebSocket endpoints и обработку нескольких клиентов, поэтому backend может использовать WebSocket для синхронизации live-состояния экскурсии.

### Критерий готовности

- Можно собрать маршрут из нескольких камер и провести простую онлайн-экскурсию.

---

# DevOps / Infrastructure

## Epic 1. Локальная инфраструктура

### Задачи

Создать `docker-compose.yml` со следующими сервисами:

- `frontend`;
- `backend`;
- `postgres`;
- `redis`;
- `mediamtx`;
- `nginx`;
- `prometheus`;
- `grafana`.

Также нужно:

- добавить `.env.example`;
- добавить healthchecks;
- настроить reverse proxy;
- настроить CORS;
- настроить HTTPS для staging/prod.

---

## Epic 2. Масштабирование

### Ключевой принцип

> Backend API и Media Gateway должны масштабироваться отдельно.

### Задачи

- Backend API сделать stateless.
- Состояние сессий и событий хранить в Redis/PostgreSQL.
- Media nodes вынести в отдельный слой.
- Добавить балансировку media nodes.
- Для популярных камер держать `always-on` streams.
- Для редких камер запускать stream `on-demand`.
- Для массового просмотра использовать HLS/LL-HLS и CDN.
- Для низкой задержки использовать WebRTC.
- Добавить Prometheus metrics:
  - active streams;
  - active viewers;
  - failed cameras;
  - stream startup time;
  - CPU/RAM media nodes;
  - bandwidth per node.

### Критерий готовности

- Можно добавить новые backend-инстансы и media-ноды без изменения frontend.
- Сервис выдерживает рост количества камер и зрителей.

---

# QA

## Основные тест-кейсы

- Пользователь открывает карту.
- Камеры загружаются только в текущей области карты.
- Клик по online-камере открывает карточку.
- Кнопка **«Смотреть»** запускает поток.
- Если камера offline — показывается понятная ошибка.
- Если stream gateway недоступен — показывается retry.
- Если пользователь двигает карту быстро — frontend не делает лишние запросы.
- Если камер 1000+ — карта не тормозит.
- Если пользователь не admin — он не видит RTSP URL.
- Если playback URL истек — поток не запускается.
- Если камера стала offline — статус обновляется.
- Если несколько пользователей смотрят одну камеру — backend не запускает лишние подключения к камере без необходимости.

---

# MVP

## Первая версия

### Frontend

- React + TypeScript + Leaflet;
- карта;
- маркеры камер;
- popup камеры;
- modal-плеер;
- HLS.js player.

### Backend

- FastAPI;
- PostgreSQL + PostGIS;
- Redis;
- Camera CRUD;
- Public API;
- Admin API;
- Stream URL generation.

### Media

- MediaMTX;
- RTSP → HLS/WebRTC;
- on-demand streams.

## MVP-функции

- Админ добавляет камеру.
- Backend проверяет RTSP.
- Камера появляется на карте.
- Пользователь кликает на камеру.
- Открывается live-видеопоток.
- Камера имеет статусы `online` / `offline`.
- Секретные данные камеры не доступны пользователю.

---

# Что не делать в первой версии

В первой версии не стоит сразу делать:

- сложные роли;
- запись архива;
- PTZ-управление;
- мобильное приложение;
- личные кабинеты;
- платежи;
- чат;
- сложную аналитику;
- AI-распознавание объектов;
- собственный видеосервер с нуля.

Сначала нужно доказать основной сценарий:

```text
Карта → Клик по камере → Стабильный live stream в браузере
```

---

# Короткая формулировка задачи для команды

Разработать масштабируемую веб-платформу для просмотра IP-камер на интерактивной карте.

Пользователь должен видеть камеры на карте, нажимать на точку и смотреть live-видеопоток в браузере.

Backend должен хранить камеры, координаты, статусы и безопасно выдавать временные ссылки на поток.

Реальные RTSP/ONVIF-доступы к камерам не должны попадать во frontend.

Для трансляции использовать отдельный media gateway, который преобразует RTSP/ONVIF-потоки камер в браузерные форматы WebRTC или HLS/LL-HLS.

Архитектура должна позволять отдельно масштабировать API, базу данных и media-ноды.

---

# Рекомендуемый порядок разработки

## Этап 1. Технический proof of concept

Цель: доказать, что поток с камеры можно открыть в браузере.

Задачи:

- поднять MediaMTX;
- подключить одну RTSP-камеру;
- получить HLS/WebRTC URL;
- открыть поток в простом HTML/React player.

---

## Этап 2. Backend MVP

Цель: сделать безопасную выдачу камер и playback URL.

Задачи:

- FastAPI;
- модель `Camera`;
- PostgreSQL + PostGIS;
- `GET /api/cameras` по bbox;
- `POST /api/cameras/{id}/play`;
- шифрование RTSP credentials;
- базовый admin CRUD.

---

## Этап 3. Frontend MVP

Цель: собрать основной пользовательский сценарий.

Задачи:

- карта на Leaflet;
- загрузка камер по bbox;
- маркеры статусов;
- popup камеры;
- modal player;
- HLS/WebRTC playback;
- fallback и retry.

---

## Этап 4. Мониторинг и стабильность

Цель: сделать сервис пригодным для реального использования.

Задачи:

- worker проверки камер;
- генерация preview;
- обновление статусов;
- история ошибок;
- Prometheus metrics;
- Grafana dashboards.

---

## Этап 5. Онлайн-экскурсии

Цель: добавить сценарии маршрутов и live-ведения.

Задачи:

- routes/camera groups;
- страница маршрута;
- режим экскурсии;
- guide mode;
- WebSocket-синхронизация состояния.

---

# Финальный принцип архитектуры

```text
Frontend не знает RTSP.
Backend не транскодирует видео сам.
Media layer занимается потоками.
PostGIS отвечает за геоданные.
Redis отвечает за события и фоновые задачи.
Каждый слой масштабируется отдельно.
```

