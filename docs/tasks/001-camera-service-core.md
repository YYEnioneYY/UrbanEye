# Task 001 — Camera Service Core

> **Цель:** реализовать базовый `Camera Service`, который хранит камеры, категории, статусы, координаты, умеет отдавать камеры по области карты через `bbox`, а также искать камеры, которые реально покрывают выбранную пользователем область на карте.
>
> При клике пользователя на место на карте сервис должен возвращать не просто камеры, направленные в сторону этой точки, а камеры, которые физически достают до выбранной области вокруг клика. По умолчанию радиус такой области считается `100` метров.

---

## 0. Метаданные задачи

| Поле | Значение |
|---|---|
| **Статус** | Ready for Development |
| **Ответственный сервис** | Camera Service |
| **Тип задачи** | Backend / Core Service |
| **Приоритет** | High |
| **Основной стек** | Python, FastAPI, PostgreSQL, PostGIS |
| **Не входит в задачу** | Видеопотоки, RTSP, WebRTC, HLS, MediaMTX, авторизация |

---

## 1. Назначение сервиса

`Camera Service` отвечает за хранение и выдачу информации о камерах.

Сервис должен работать как центральный источник данных о камерах для frontend, Stream Service, Probe Worker, Admin Service и будущих сервисов маршрутов/экскурсий.

### Camera Service отвечает за

- хранение камер;
- координаты камер;
- статусы камер;
- категории камер;
- получение камер по области карты через `bbox`;
- получение камер, которые реально покрывают выбранную пользователем область на карте;
- подготовку архитектуры для будущих расширений:
  - маршруты;
  - онлайн-экскурсии;
  - зоны видимости;
  - preview-изображения;
  - права доступа;
  - stream-конфигурация;
  - RTSP/ONVIF credentials.

### Camera Service не отвечает за

- воспроизведение видео;
- RTSP-подключение;
- WebRTC;
- HLS;
- MediaMTX;
- запуск stream-сессий;
- авторизацию пользователей;
- frontend-админку.

> **Важно:** Camera Service только хранит информацию о камерах и предоставляет данные другим сервисам. Он не должен стримить видео.

---

## 2. Краткое описание сценария

Пользователь открывает карту и видит камеры в текущей области карты.

Frontend отправляет запрос:

```http
GET /api/cameras?bbox=minLng,minLat,maxLng,maxLat
```

Camera Service возвращает список камер, которые находятся внутри этой области.

Также пользователь может кликнуть на конкретное место на карте. Тогда frontend отправляет координаты точки:

```http
GET /api/cameras/looking-at?lat=59.9343&lng=30.3351
```

Camera Service должен вернуть камеры, которые потенциально могут показать выбранное место.

Важно: выбранное место считается не математической точкой размером `0` метров, а небольшой областью вокруг клика. По умолчанию радиус этой области:

```text
100 метров
```

---

## 3. Основные сценарии

### Сценарий 1 — пользователь открывает карту

1. Пользователь открывает frontend.
2. Frontend определяет текущую область карты.
3. Frontend отправляет `bbox`-запрос.
4. Camera Service возвращает камеры в текущей области.
5. Frontend отображает камеры на карте.

```http
GET /api/cameras?bbox=30.20,59.90,30.40,60.00
```

---

### Сценарий 2 — пользователь двигает карту

1. Пользователь перемещает или масштабирует карту.
2. Frontend получает новый `bbox`.
3. Frontend отправляет новый запрос.
4. Camera Service возвращает только камеры в новой области.
5. Frontend обновляет маркеры.

---

### Сценарий 3 — пользователь кликает на камеру

1. Пользователь кликает на маркер камеры.
2. Frontend запрашивает подробную информацию о камере.
3. Camera Service возвращает:
   - название;
   - описание;
   - координаты;
   - статус;
   - категорию;
   - preview;
   - доступные возможности.

```http
GET /api/cameras/{camera_id}
```

---

### Сценарий 4 — пользователь кликает на место на карте

1. Пользователь нажимает на точку на карте.
2. Frontend отправляет координаты точки.
3. Camera Service ищет камеры, которые реально покрывают область вокруг этой точки.
4. Сервис возвращает подходящие камеры.
5. Frontend показывает пользователю список камер, с которых можно посмотреть выбранное место.

```http
GET /api/cameras/looking-at?lat=59.9343&lng=30.3351&target_radius_meters=100
```

---

## 4. Технологии

| Технология | Назначение |
|---|---|
| **Python** | основной язык сервиса |
| **FastAPI** | HTTP API |
| **PostgreSQL** | основная база данных |
| **PostGIS** | геоданные и spatial-запросы |
| **SQLAlchemy 2.x** | ORM |
| **GeoAlchemy2** | работа с PostGIS-полями через SQLAlchemy |
| **Alembic** | миграции |
| **Pydantic** | валидация входных/выходных данных |
| **pytest** | тесты |
| **Docker** | запуск сервиса |

### Зачем нужен PostGIS

PostGIS нужен для удобной и быстрой работы с геоданными:

- поиск камер внутри `bbox`;
- поиск ближайших камер;
- поиск камер в радиусе;
- будущая поддержка зон видимости;
- будущая поддержка маршрутов и геозон.

---

## 5. Основные сущности

## 5.1 Camera

Основная сущность камеры.

| Поле | Тип | Описание |
|---|---|---|
| `id` | UUID | уникальный идентификатор камеры |
| `title` | string | название камеры |
| `description` | text / null | описание камеры |
| `latitude` | float | широта |
| `longitude` | float | долгота |
| `location` | PostGIS Point | географическое поле для spatial-запросов |
| `status` | enum/string | статус камеры |
| `category_id` | UUID / null | категория камеры |
| `is_public` | boolean | публичная ли камера |
| `is_active` | boolean | активна ли камера в системе |
| `preview_url` | text / null | ссылка на preview-изображение |
| `azimuth` | float / null | направление камеры в градусах |
| `view_angle` | float / null | угол обзора камеры |
| `view_distance_meters` | float / null | дальность обзора |
| `has_audio` | boolean | есть ли аудио |
| `has_ptz` | boolean | есть ли PTZ |
| `has_night_vision` | boolean | есть ли ночное видение |
| `created_at` | datetime | дата создания |
| `updated_at` | datetime | дата обновления |
| `deleted_at` | datetime / null | дата мягкого удаления |

### Важные поля

#### `location`

Географическое поле PostGIS типа `Point`.

Рекомендуемый тип:

```sql
GEOGRAPHY(POINT, 4326)
```

#### `latitude`, `longitude` и `location`

Поля:

```text
latitude
longitude
```

нужны для удобной отдачи данных во frontend.

Поле:

```text
location
```

нужно для быстрых spatial-запросов через PostGIS.

При создании или обновлении камеры `location` должно автоматически пересчитываться из `longitude` и `latitude`.

Пример:

```sql
ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
```

Важно: в PostGIS порядок координат для `ST_MakePoint` такой:

```text
longitude, latitude
```

а не наоборот.

#### `status`

Текущий статус камеры:

- `online`;
- `offline`;
- `maintenance`;
- `unknown`;
- `auth_error`;
- `stream_error`.

Для первого этапа обязательно поддержать:

- `online`;
- `offline`;
- `maintenance`;
- `unknown`.

Остальные статусы можно заложить в enum сразу, но не обязательно реализовывать бизнес-логику вокруг них в Task 001.

#### `azimuth`

Направление камеры в градусах:

| Значение | Направление |
|---:|---|
| `0` | север |
| `90` | восток |
| `180` | юг |
| `270` | запад |

#### `view_angle`

Угол обзора камеры в градусах. Например: `60`, `90`, `120`.

#### `view_distance_meters`

Примерная дальность обзора камеры. Например: `100`, `300`, `1000`.

---

## 5.2 CameraStatus

| Статус | Описание |
|---|---|
| `online` | камера доступна |
| `offline` | камера недоступна |
| `maintenance` | камера находится в обслуживании |
| `unknown` | статус неизвестен |
| `auth_error` | ошибка авторизации камеры |
| `stream_error` | ошибка чтения потока |

На первом этапе обязательно поддержать:

- `online`;
- `offline`;
- `maintenance`;
- `unknown`.

---

## 5.3 CameraCategory

Категория камеры.

| Поле | Тип | Описание |
|---|---|---|
| `id` | UUID | уникальный идентификатор |
| `code` | string | системный код категории |
| `title` | string | название категории |
| `description` | text / null | описание |
| `icon` | string / null | иконка категории |
| `color` | string / null | цвет категории |
| `created_at` | datetime | дата создания |
| `updated_at` | datetime | дата обновления |

### Примеры категорий

| Code | Title | Описание |
|---|---|---|
| `tourism` | Туризм | туристические места |
| `city` | Город | городские виды |
| `nature` | Природа | парки, реки, леса |
| `road` | Дороги | дороги и перекрестки |
| `building` | Здания | здания и архитектура |
| `event` | События | места событий |
| `other` | Другое | прочее |

---

## 5.4 CameraStatusHistory

История изменения статусов камеры. Нужна для будущего мониторинга камер.

| Поле | Тип | Описание |
|---|---|---|
| `id` | UUID | уникальный идентификатор |
| `camera_id` | UUID | ссылка на камеру |
| `old_status` | string / null | предыдущий статус |
| `new_status` | string | новый статус |
| `reason` | text / null | причина изменения |
| `created_at` | datetime | дата события |

---

## 6. База данных

## 6.0 PostgreSQL и PostGIS

Важно понимать: PostGIS — это не отдельная база данных.

PostGIS — это расширение PostgreSQL, которое добавляет:

- географические типы данных;
- geometry/geography поля;
- spatial-индексы;
- функции для работы с расстояниями, пересечениями, полигонами и областями.

Поэтому все таблицы физически находятся в PostgreSQL.

Когда в задаче говорится “PostGIS-таблица”, это означает обычную таблицу PostgreSQL, в которой есть spatial-поля типа `GEOGRAPHY` или `GEOMETRY`.

Перед созданием таблиц нужно включить расширение:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Обычные PostgreSQL-таблицы

Эти таблицы не требуют spatial-полей:

| Таблица | Назначение |
|---|---|
| `camera_categories` | категории камер |
| `camera_status_history` | история изменения статусов камер |

### PostgreSQL-таблицы с PostGIS-полями

Эти таблицы являются обычными PostgreSQL-таблицами, но используют возможности PostGIS:

| Таблица | PostGIS-поля | Назначение |
|---|---|---|
| `cameras` | `location GEOGRAPHY(POINT, 4326)` | координаты камеры и spatial-поиск |

### В рамках Task 001 обязательно

В этой задаче обязательно использовать PostGIS только для таблицы:

```text
cameras
```

Обязательное spatial-поле:

```sql
location GEOGRAPHY(POINT, 4326) NOT NULL
```

Обязательный spatial-индекс:

```sql
CREATE INDEX idx_cameras_location
ON cameras
USING GIST (location);
```

### В будущем можно добавить PostGIS-таблицы

Для будущих задач можно будет добавить:

| Таблица | PostGIS-поля | Для чего |
|---|---|---|
| `camera_view_zones` | `zone GEOMETRY(POLYGON, 4326)` | точная зона видимости камеры |
| `tour_routes` | `route GEOMETRY(LINESTRING, 4326)` | маршруты онлайн-экскурсий |
| `geo_areas` | `area GEOMETRY(POLYGON, 4326)` | районы, парки, зоны интереса |
| `points_of_interest` | `location GEOGRAPHY(POINT, 4326)` | достопримечательности и места на карте |

Но в рамках Task 001 эти таблицы делать не нужно.

---

## 6.1 Таблица `camera_categories`

```sql
CREATE TABLE camera_categories (
    id UUID PRIMARY KEY,

    code VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    icon VARCHAR(128),
    color VARCHAR(32),

    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

---

## 6.2 Таблица `cameras`

```sql
CREATE TABLE cameras (
    id UUID PRIMARY KEY,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,

    status VARCHAR(32) NOT NULL DEFAULT 'unknown',
    category_id UUID REFERENCES camera_categories(id),

    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    preview_url TEXT,

    azimuth DOUBLE PRECISION,
    view_angle DOUBLE PRECISION,
    view_distance_meters DOUBLE PRECISION,

    has_audio BOOLEAN NOT NULL DEFAULT FALSE,
    has_ptz BOOLEAN NOT NULL DEFAULT FALSE,
    has_night_vision BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,

    CONSTRAINT chk_cameras_latitude
        CHECK (latitude >= -90 AND latitude <= 90),

    CONSTRAINT chk_cameras_longitude
        CHECK (longitude >= -180 AND longitude <= 180),

    CONSTRAINT chk_cameras_azimuth
        CHECK (azimuth IS NULL OR (azimuth >= 0 AND azimuth <= 360)),

    CONSTRAINT chk_cameras_view_angle
        CHECK (view_angle IS NULL OR (view_angle > 0 AND view_angle <= 360)),

    CONSTRAINT chk_cameras_view_distance
        CHECK (view_distance_meters IS NULL OR view_distance_meters > 0)
);
```

### Индексы

```sql
CREATE INDEX idx_cameras_location ON cameras USING GIST (location);
CREATE INDEX idx_cameras_status ON cameras (status);
CREATE INDEX idx_cameras_category_id ON cameras (category_id);
CREATE INDEX idx_cameras_is_public ON cameras (is_public);
CREATE INDEX idx_cameras_is_active ON cameras (is_active);
CREATE INDEX idx_cameras_deleted_at ON cameras (deleted_at);
```

---

## 6.3 Таблица `camera_status_history`

```sql
CREATE TABLE camera_status_history (
    id UUID PRIMARY KEY,

    camera_id UUID NOT NULL REFERENCES cameras(id),

    old_status VARCHAR(32),
    new_status VARCHAR(32) NOT NULL,
    reason TEXT,

    created_at TIMESTAMP NOT NULL
);
```

### Индексы

```sql
CREATE INDEX idx_camera_status_history_camera_id
ON camera_status_history (camera_id);

CREATE INDEX idx_camera_status_history_created_at
ON camera_status_history (created_at);
```

---

## 7. API

## 7.1 Получить камеры по `bbox`

```http
GET /api/cameras?bbox=minLng,minLat,maxLng,maxLat
```

### Пример

```http
GET /api/cameras?bbox=30.20,59.90,30.40,60.00
```

### Query params

| Параметр | Обязательный | Default | Описание |
|---|---:|---:|---|
| `bbox` | да | — | область карты в формате `minLng,minLat,maxLng,maxLat` |
| `status` | нет | — | фильтр по статусу |
| `category` | нет | — | фильтр по коду категории |
| `is_public` | нет | — | фильтр по публичности |
| `limit` | нет | `500` | максимум результатов |
| `offset` | нет | `0` | смещение для пагинации |

### Response

```json
{
  "items": [
    {
      "id": "camera_uuid",
      "title": "Дворцовая площадь",
      "description": "Вид на площадь",
      "latitude": 59.9398,
      "longitude": 30.3146,
      "status": "online",
      "category": {
        "id": "category_uuid",
        "code": "tourism",
        "title": "Туризм"
      },
      "preview_url": "https://cdn.example.com/previews/cam-1.jpg",
      "azimuth": 120,
      "view_angle": 90,
      "view_distance_meters": 500,
      "has_audio": false,
      "has_ptz": true
    }
  ],
  "total": 1
}
```

### Логика

Сервис должен вернуть только камеры, которые:

- находятся внутри переданного `bbox`;
- `deleted_at IS NULL`;
- `is_active = true`;
- соответствуют фильтрам `status`, `category`, `is_public`, если они переданы.

### Рекомендуемая PostGIS-логика

Для `bbox` можно использовать envelope/polygon и spatial-фильтрацию.

Пример SQL-идеи:

```sql
ST_Intersects(
    cameras.location::geometry,
    ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
)
```

---

## 7.2 Получить камеру по ID

```http
GET /api/cameras/{camera_id}
```

### Response

```json
{
  "id": "camera_uuid",
  "title": "Дворцовая площадь",
  "description": "Вид на площадь",
  "latitude": 59.9398,
  "longitude": 30.3146,
  "status": "online",
  "category": {
    "id": "category_uuid",
    "code": "tourism",
    "title": "Туризм"
  },
  "is_public": true,
  "preview_url": "https://cdn.example.com/previews/cam-1.jpg",
  "azimuth": 120,
  "view_angle": 90,
  "view_distance_meters": 500,
  "has_audio": false,
  "has_ptz": true,
  "has_night_vision": false,
  "created_at": "2026-05-08T12:00:00Z",
  "updated_at": "2026-05-08T12:00:00Z"
}
```

---

## 7.3 Получить камеры, которые покрывают выбранную точку

```http
GET /api/cameras/looking-at?lat={lat}&lng={lng}
```

### Пример

```http
GET /api/cameras/looking-at?lat=59.9343&lng=30.3351&target_radius_meters=100
```

### Query params

| Параметр | Обязательный | Default | Описание |
|---|---:|---:|---|
| `lat` | да | — | широта выбранной точки |
| `lng` | да | — | долгота выбранной точки |
| `camera_search_radius_meters` | нет | `1000` | максимальный радиус поиска камер вокруг выбранной точки |
| `target_radius_meters` | нет | `100` | радиус зоны вокруг выбранной точки, которую камера должна реально покрывать |
| `status` | нет | `online` | статус камеры |
| `category` | нет | — | категория камеры |
| `limit` | нет | `20` | максимум результатов |

### Важное уточнение по логике

Сервис не должен возвращать все камеры, которые просто направлены в сторону выбранной точки.

Нужно вернуть только те камеры, которые:

1. находятся в разумном радиусе поиска от выбранной точки;
2. имеют заполненные параметры обзора:
   - `azimuth`;
   - `view_angle`;
   - `view_distance_meters`;
3. направлены в сторону выбранной точки;
4. реально достают до выбранной точки по дальности обзора;
5. покрывают выбранную область вокруг клика, например `100` метров.

То есть пользователь кликает не математическую точку размером `0` метров, а интересующую его область на карте.

По умолчанию считать, что интересующая область вокруг клика имеет радиус:

```text
target_radius_meters = 100
```

Это значит: если камера смотрит примерно в сторону точки, но ее зона обзора проходит слишком далеко от выбранного места, такую камеру лучше не возвращать.

### Логика

1. Найти камеры в радиусе `camera_search_radius_meters` от выбранной точки.
2. Отфильтровать камеры:
   - `deleted_at IS NULL`;
   - `is_active = true`;
   - статус соответствует фильтру;
   - категория соответствует фильтру, если передана;
   - `azimuth IS NOT NULL`;
   - `view_angle IS NOT NULL`;
   - `view_distance_meters IS NOT NULL`.
3. Для каждой камеры вычислить расстояние от камеры до выбранной точки.
4. Проверить, что камера физически может достать до выбранной точки:

```text
distance_to_point_meters <= view_distance_meters
```

5. Вычислить направление от камеры до выбранной точки:

```text
bearing_to_point
```

6. Вычислить разницу между направлением камеры и направлением на выбранную точку:

```text
angle_diff = angle_difference(camera.azimuth, bearing_to_point)
```

7. Проверить, что выбранная точка попадает в угол обзора камеры:

```text
angle_diff <= camera.view_angle / 2
```

8. Дополнительно проверить, что камера смотрит достаточно близко к выбранной зоне, а не просто краем широкого угла обзора.

Для этого вычислить примерное отклонение точки от центральной линии взгляда камеры:

```text
centerline_offset_meters = distance_to_point_meters * sin(angle_diff)
```

Важно: перед использованием `sin` угол нужно перевести из градусов в радианы.

9. Камера подходит, если:

```text
centerline_offset_meters <= target_radius_meters
```

10. Вернуть подходящие камеры, отсортированные по `match_score`.

### Response

```json
{
  "items": [
    {
      "id": "camera_uuid",
      "title": "Камера на Невском",
      "latitude": 59.9341,
      "longitude": 30.3347,
      "status": "online",
      "preview_url": "https://cdn.example.com/previews/cam-2.jpg",
      "azimuth": 45,
      "view_angle": 90,
      "view_distance_meters": 300,
      "distance_to_point_meters": 80,
      "centerline_offset_meters": 12,
      "target_radius_meters": 100,
      "match_score": 0.92
    }
  ],
  "total": 1
}
```

---

## 7.4 Создать камеру

```http
POST /api/admin/cameras
```

### Доступ

```text
admin
```

> В рамках Task 001 авторизация не реализуется. Endpoint можно подготовить как admin endpoint, но без полноценной проверки ролей.

### Request

```json
{
  "title": "Дворцовая площадь",
  "description": "Камера с видом на площадь",
  "latitude": 59.9398,
  "longitude": 30.3146,
  "status": "unknown",
  "category_id": "category_uuid",
  "is_public": true,
  "preview_url": null,
  "azimuth": 120,
  "view_angle": 90,
  "view_distance_meters": 500,
  "has_audio": false,
  "has_ptz": true,
  "has_night_vision": false
}
```

### Response

```json
{
  "id": "camera_uuid",
  "title": "Дворцовая площадь",
  "status": "unknown"
}
```

---

## 7.5 Обновить камеру

```http
PATCH /api/admin/cameras/{camera_id}
```

### Доступ

```text
admin
```

### Request

```json
{
  "title": "Новое название камеры",
  "status": "maintenance",
  "azimuth": 130,
  "view_angle": 80,
  "view_distance_meters": 400
}
```

При обновлении `latitude` или `longitude` нужно пересчитать поле `location`.

---

## 7.6 Мягко удалить камеру

```http
DELETE /api/admin/cameras/{camera_id}
```

### Доступ

```text
admin
```

### Важно

Физически из базы камеру не удалять. Нужно заполнить поле:

```text
deleted_at
```

После этого камера не должна возвращаться в публичных API.

---

## 7.7 Получить категории камер

```http
GET /api/camera-categories
```

### Response

```json
{
  "items": [
    {
      "id": "category_uuid",
      "code": "tourism",
      "title": "Туризм",
      "icon": "landmark",
      "color": "#FFD700"
    }
  ]
}
```

---

## 7.8 Создать категорию

```http
POST /api/admin/camera-categories
```

### Доступ

```text
admin
```

### Request

```json
{
  "code": "tourism",
  "title": "Туризм",
  "description": "Камеры у туристических мест",
  "icon": "landmark",
  "color": "#FFD700"
}
```

---

## 7.9 Healthcheck

```http
GET /health
```

### Response

```json
{
  "status": "ok",
  "service": "camera-service"
}
```

---

## 8. Логика поиска камер, которые покрывают точку

У камеры должны быть параметры:

- `latitude`;
- `longitude`;
- `azimuth`;
- `view_angle`;
- `view_distance_meters`.

Где:

- `azimuth` — направление камеры;
- `view_angle` — ширина обзора;
- `view_distance_meters` — дальность обзора.

### 8.1 Упрощенная схема

```text
Камера стоит в точке A.
Пользователь кликнул точку B.

Нужно понять:

1. Как далеко точка B от камеры A.
2. В каком направлении от камеры находится точка B.
3. Совпадает ли это направление с направлением камеры.
4. Попадает ли точка в угол обзора камеры.
5. Достает ли камера до этой точки по дальности.
6. Достаточно ли близко центральное направление камеры проходит к области клика.
```

### 8.2 Формула проверки сектора обзора

```text
angle_diff = abs(camera.azimuth - bearing_to_clicked_point)

if angle_diff > 180:
    angle_diff = 360 - angle_diff

point_is_visible =
    angle_diff <= camera.view_angle / 2
    and distance_to_point <= camera.view_distance_meters
```

### Пример

```text
camera.azimuth = 90
view_angle = 60
```

Значит камера смотрит примерно в сектор:

```text
от 60 градусов до 120 градусов
```

Если точка находится в этом секторе и не дальше `view_distance_meters`, камера подходит по базовой проверке.

---

### 8.3 Проверка, что камера реально достает до выбранной зоны

Недостаточно проверить, что камера смотрит в сторону точки.

Нужно также проверить, что выбранная точка находится в пределах дальности обзора камеры:

```text
distance_to_point_meters <= camera.view_distance_meters
```

Пример:

```text
distance_to_point_meters = 250
camera.view_distance_meters = 300
```

Камера по дальности подходит.

```text
distance_to_point_meters = 450
camera.view_distance_meters = 300
```

Камера не подходит, даже если она направлена в сторону точки.

---

### 8.4 Проверка зоны вокруг клика

Пользователь кликает не идеальную математическую точку, а место на карте.

Поэтому нужно считать, что вокруг клика есть небольшая зона интереса.

Default:

```text
target_radius_meters = 100
```

Камера должна покрывать эту зону достаточно близко.

Для этого можно считать отклонение выбранной точки от центральной линии взгляда камеры:

```text
centerline_offset_meters = distance_to_point_meters * sin(angle_diff)
```

Важно: `angle_diff` нужно перевести в радианы перед вызовом `sin`.

Если:

```text
centerline_offset_meters <= target_radius_meters
```

то камера считается достаточно точно направленной на выбранное место.

Если:

```text
centerline_offset_meters > target_radius_meters
```

то камера смотрит слишком в сторону, даже если точка формально попадает в широкий угол обзора.

---

## 9. Сортировка камер для `looking-at`

Камеры нужно сортировать не просто по расстоянию, а по релевантности.

### Учитывать в `match_score`

- чем ближе точка к центральному направлению камеры — тем лучше;
- чем меньше отклонение от центральной линии взгляда — тем лучше;
- чем ближе камера к точке — тем лучше;
- чем больше запас по дальности обзора — тем лучше;
- online камеры выше offline;
- публичные камеры выше приватных для обычного пользователя.

### Упрощенная формула

```text
angle_score = 1 - angle_diff / (view_angle / 2)

distance_score = 1 - distance_to_point_meters / view_distance_meters

centerline_score = 1 - centerline_offset_meters / target_radius_meters

match_score =
    angle_score * 0.4 +
    centerline_score * 0.4 +
    distance_score * 0.2
```

### Ограничения

Каждый score должен быть приведен к диапазону:

```text
0.0 <= score <= 1.0
```

Итоговый `match_score` тоже должен быть в диапазоне:

```text
0.0 <= match_score <= 1.0
```

### Важно

Если:

```text
distance_to_point_meters > view_distance_meters
```

или:

```text
angle_diff > view_angle / 2
```

или:

```text
centerline_offset_meters > target_radius_meters
```

камера не должна попадать в результат.

---

## 10. Обязательные функции в `geo.py`

В модуле:

```text
app/cameras/geo.py
```

должны быть функции:

```python
def calculate_distance_meters(
    camera_lat: float,
    camera_lng: float,
    target_lat: float,
    target_lng: float,
) -> float:
    pass


def calculate_bearing_degrees(
    camera_lat: float,
    camera_lng: float,
    target_lat: float,
    target_lng: float,
) -> float:
    pass


def calculate_angle_difference(
    camera_azimuth: float,
    bearing_to_target: float,
) -> float:
    pass


def calculate_centerline_offset_meters(
    distance_meters: float,
    angle_difference_degrees: float,
) -> float:
    pass


def is_point_inside_camera_view(
    camera_lat: float,
    camera_lng: float,
    camera_azimuth: float,
    camera_view_angle: float,
    camera_view_distance_meters: float,
    target_lat: float,
    target_lng: float,
    target_radius_meters: float = 100,
) -> bool:
    pass


def calculate_camera_match_score(
    angle_difference: float,
    view_angle: float,
    distance_meters: float,
    view_distance_meters: float,
    centerline_offset_meters: float,
    target_radius_meters: float,
) -> float:
    pass
```

---

## 11. Валидация данных

| Поле | Правило |
|---|---|
| `latitude` | от `-90` до `90` |
| `longitude` | от `-180` до `180` |
| `azimuth` | от `0` до `360` |
| `view_angle` | больше `0` и не больше `360` |
| `view_distance_meters` | больше `0` |
| `title` | не пустой |
| `status` | только из разрешенного списка |
| `category_id` | должен существовать, если передан |
| `camera_search_radius_meters` | больше `0`, рекомендуемый максимум `10000` |
| `target_radius_meters` | больше `0`, default `100` |

---

## 12. Seed-данные

Нужно добавить seed для базовых категорий:

```json
[
  {
    "code": "tourism",
    "title": "Туризм",
    "icon": "landmark",
    "color": "#FFD700"
  },
  {
    "code": "city",
    "title": "Город",
    "icon": "building",
    "color": "#4A90E2"
  },
  {
    "code": "nature",
    "title": "Природа",
    "icon": "tree",
    "color": "#4CAF50"
  },
  {
    "code": "road",
    "title": "Дороги",
    "icon": "road",
    "color": "#607D8B"
  },
  {
    "code": "building",
    "title": "Здания",
    "icon": "building-2",
    "color": "#9C27B0"
  },
  {
    "code": "event",
    "title": "События",
    "icon": "calendar",
    "color": "#FF5722"
  },
  {
    "code": "other",
    "title": "Другое",
    "icon": "circle",
    "color": "#9E9E9E"
  }
]
```

---

## 13. Требования к архитектуре кода

Пример структуры:

```text
camera-service/
  app/
    main.py
    config.py
    database.py

    cameras/
      models.py
      schemas.py
      repository.py
      service.py
      router.py
      geo.py

    categories/
      models.py
      schemas.py
      repository.py
      service.py
      router.py

    status_history/
      models.py
      repository.py
      service.py

    common/
      pagination.py
      errors.py
      dependencies.py

    migrations/

  tests/
    test_cameras_api.py
    test_camera_geo.py
    test_categories_api.py

  Dockerfile
  pyproject.toml
  README.md
```

---

## 14. Архитектурные правила

### 14.1 Разделение слоев

| Слой | Назначение |
|---|---|
| `router.py` | HTTP endpoints |
| `schemas.py` | Pydantic-схемы |
| `models.py` | SQLAlchemy-модели |
| `repository.py` | запросы к базе |
| `service.py` | бизнес-логика |
| `geo.py` | географические вычисления |

### 14.2 Что нельзя делать

Нельзя:

- писать SQL прямо в router без необходимости;
- смешивать HTTP-логику с бизнес-логикой;
- возвращать удаленные камеры из публичного API;
- хранить геологику внутри endpoint;
- закладывать RTSP/ONVIF-секреты в публичные DTO;
- реализовывать стриминг внутри Camera Service;
- считать, что PostGIS — это отдельная база данных;
- забывать пересчитывать `location` при изменении `latitude` / `longitude`.

---

## 15. Расширяемость

Сервис нужно писать так, чтобы позже можно было добавить:

- RTSP/ONVIF credentials;
- интеграцию со Stream Service;
- preview камер;
- историю статусов;
- модерацию камер;
- приватные камеры;
- права доступа;
- PTZ-управление;
- зоны видимости;
- 3D-направление камеры;
- высоту установки камеры;
- угол наклона камеры;
- маршруты онлайн-экскурсий;
- группы камер;
- избранные камеры;
- аналитику просмотров.

> **Важно:** в коде нельзя жестко завязываться только на текущий MVP.

---

## 16. Что не входит в Task 001

В рамках этой задачи не нужно реализовывать:

- видеопотоки;
- RTSP-подключение;
- WebRTC;
- HLS;
- MediaMTX;
- логин пользователей;
- роли пользователей;
- права доступа;
- Stream Service;
- Preview Service;
- Probe Worker;
- онлайн-экскурсии;
- админскую frontend-панель.

Эта задача только про:

```text
Camera Service Core
```

---

## 17. Тесты

Разработчик должен покрыть тестами следующие сценарии.

### 17.1 Камеры

- [ ] создание камеры;
- [ ] получение камеры по ID;
- [ ] обновление камеры;
- [ ] мягкое удаление камеры;
- [ ] камера с `deleted_at` не возвращается в публичном API;
- [ ] нельзя создать камеру с неверными координатами;
- [ ] нельзя создать камеру с неверным `status`;
- [ ] при создании камеры корректно создается `location`;
- [ ] при изменении `latitude` / `longitude` пересчитывается `location`.

### 17.2 Категории

- [ ] создание категории;
- [ ] получение списка категорий;
- [ ] нельзя создать категорию с повторяющимся `code`;
- [ ] нельзя создать камеру с несуществующей `category_id`.

### 17.3 `bbox`

- [ ] камера внутри `bbox` возвращается;
- [ ] камера вне `bbox` не возвращается;
- [ ] фильтр по `status` работает;
- [ ] фильтр по `category` работает;
- [ ] `limit` / `offset` работают;
- [ ] камеры с `deleted_at IS NOT NULL` не возвращаются;
- [ ] камеры с `is_active = false` не возвращаются.

### 17.4 `looking-at`

- [ ] камера, направленная на точку, возвращается;
- [ ] камера, направленная в другую сторону, не возвращается;
- [ ] камера, у которой точка дальше `view_distance_meters`, не возвращается;
- [ ] камера не возвращается, если `centerline_offset_meters` больше `target_radius_meters`;
- [ ] камера возвращается, если точка находится внутри угла обзора и в пределах `target_radius_meters`;
- [ ] параметр `target_radius_meters` влияет на результат;
- [ ] по умолчанию `target_radius_meters = 100`;
- [ ] параметр `camera_search_radius_meters` ограничивает первичный поиск камер;
- [ ] камеры сортируются по `match_score`;
- [ ] камера без `azimuth` / `view_angle` / `view_distance_meters` не участвует в `looking-at` поиске.

### 17.5 Гео-функции

- [ ] `calculate_distance_meters` считает расстояние в метрах;
- [ ] `calculate_bearing_degrees` считает направление в градусах;
- [ ] `calculate_angle_difference` корректно работает на переходе через `0/360`;
- [ ] `calculate_centerline_offset_meters` корректно считает отклонение точки от центральной линии взгляда камеры;
- [ ] `is_point_inside_camera_view` возвращает `true` для точки внутри сектора;
- [ ] `is_point_inside_camera_view` возвращает `false` для точки вне сектора;
- [ ] `calculate_camera_match_score` возвращает значение от `0` до `1`.

---

## 18. API ошибки

Стандартный формат ошибок:

```json
{
  "error": "validation_error",
  "message": "Invalid latitude",
  "details": {
    "field": "latitude"
  }
}
```

### Основные ошибки

| HTTP Code | Причина |
|---:|---|
| `400` | неверные параметры запроса |
| `404` | камера не найдена |
| `409` | конфликт, например повторяющийся category code |
| `422` | ошибка валидации |
| `500` | внутренняя ошибка сервиса |

---

## 19. Docker

Нужно подготовить:

- `Dockerfile`;
- блок сервиса для `docker-compose.yml`;
- `.env.example`.

### Пример `.env.example`

```env
CAMERA_SERVICE_NAME=camera-service
CAMERA_DATABASE_URL=postgresql+asyncpg://camera:camera@postgres:5432/camera_db
CAMERA_API_PORT=8001
ENVIRONMENT=local
```

### Пример блока `docker-compose.yml`

```yaml
camera-service:
  build:
    context: ./camera-service
    dockerfile: Dockerfile
  container_name: camera-service
  env_file:
    - ./camera-service/.env
  ports:
    - "8001:8001"
  depends_on:
    - postgres
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

---

## 20. Healthcheck

Endpoint:

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "service": "camera-service"
}
```

Healthcheck должен проверять:

- что приложение живо;
- что соединение с базой доступно;
- что расширение PostGIS доступно.

---

## 21. Definition of Done

Задача считается выполненной, если:

- [ ] Camera Service запускается в Docker.
- [ ] Подключен PostgreSQL + PostGIS.
- [ ] Расширение PostGIS включается через миграции или init-скрипт.
- [ ] Есть миграции Alembic.
- [ ] Есть таблицы:
  - `cameras`;
  - `camera_categories`;
  - `camera_status_history`.
- [ ] В документации явно описано, какие таблицы используют обычные PostgreSQL-поля, а какие используют PostGIS-поля.
- [ ] В таблице `cameras` есть поле `location GEOGRAPHY(POINT, 4326)`.
- [ ] На поле `location` создан GIST-индекс.
- [ ] Можно создать камеру.
- [ ] При создании камеры корректно создается `location` из `longitude` и `latitude`.
- [ ] Можно получить камеру по ID.
- [ ] Можно обновить камеру.
- [ ] При обновлении координат пересчитывается `location`.
- [ ] Можно мягко удалить камеру.
- [ ] Можно получить список камер по `bbox`.
- [ ] Можно фильтровать камеры по `status`.
- [ ] Можно фильтровать камеры по `category`.
- [ ] Можно получить список категорий.
- [ ] Можно создать категорию.
- [ ] Можно найти камеры, которые смотрят в выбранную точку.
- [ ] `looking-at` возвращает не все камеры, направленные в сторону точки, а только камеры, которые реально достают до выбранной зоны.
- [ ] Для `looking-at` поддерживается параметр `target_radius_meters`.
- [ ] По умолчанию `target_radius_meters = 100`.
- [ ] Камера не возвращается, если выбранная точка дальше `view_distance_meters`.
- [ ] Камера не возвращается, если отклонение от центральной линии взгляда больше `target_radius_meters`.
- [ ] Гео-логика вынесена в отдельный модуль.
- [ ] Основные сценарии покрыты тестами.
- [ ] Сервис не занимается видеопотоками.
- [ ] API не возвращает никаких RTSP/ONVIF-секретов.
- [ ] Код написан так, чтобы позже можно было добавить:
  - `stream_config`;
  - preview;
  - permissions;
  - routes.

---

## 22. Главное правило задачи

```text
Camera Service хранит данные о камерах.
Stream Service управляет запуском просмотра.
Media Gateway работает с видео.
Frontend получает только безопасные публичные данные.
```

Camera Service не должен превращаться в сервис, который делает всё сразу.

Его ядро:

```text
Камеры + Координаты + Категории + Статусы + Геопоиск
```

---

## 23. Итоговая логика клика по карте

```text
Пользователь кликает место на карте
        ↓
Ищем камеры рядом в camera_search_radius_meters
        ↓
Проверяем, что камера активна и не удалена
        ↓
Проверяем направление камеры
        ↓
Проверяем дальность обзора
        ↓
Проверяем попадание в зону target_radius_meters вокруг клика
        ↓
Сортируем по релевантности
        ↓
Отдаем лучшие камеры
```

Краткая формула:

```text
Камера подходит, если:

1. distance_to_point_meters <= view_distance_meters
2. angle_diff <= view_angle / 2
3. centerline_offset_meters <= target_radius_meters
```