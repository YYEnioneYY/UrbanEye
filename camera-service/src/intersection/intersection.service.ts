import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { EncryptionService } from '../encryption/encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIntersectionDto } from './dto/create-intersection.dto';
import { CreateIntersectionCameraDto } from './dto/create-intersection-camera.dto';
import { FindIntersectionsBboxDto } from './dto/find-intersections-bbox.dto';
import { UpdateIntersectionDto } from './dto/update-intersection.dto';

type IntersectionRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: 'active' | 'hidden' | 'maintenance';
  city: string | null;
  address: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  cameras_count: number;
  online_cameras_count: number;
  created_at: Date;
  updated_at: Date;
};

type IntersectionCameraRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: 'online' | 'offline' | 'maintenance' | 'planned';
  city: string | null;
  address: string | null;
  category: string | null;
  preview_url: string | null;
  latitude: number;
  longitude: number;
  direction_deg: number | null;
  fov_deg: number;
  range_meters: number;
  views_count: number;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class IntersectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(dto: CreateIntersectionDto) {
    const intersectionId = randomUUID();
    const slug = this.createSlug(dto.title, dto.slug);

    const rows = await this.prisma.$queryRaw<IntersectionRow[]>`
      INSERT INTO intersections (
        id,
        title,
        slug,
        description,
        city,
        address,
        category,
        status,
        location,
        created_at,
        updated_at
      )
      VALUES (
        ${intersectionId}::uuid,
        ${dto.title},
        ${slug},
        ${dto.description ?? null},
        ${dto.city ?? null},
        ${dto.address ?? null},
        ${dto.category ?? null},
        'active'::intersection_status,
        ST_SetSRID(
          ST_MakePoint(
            CAST(${dto.longitude} AS double precision),
            CAST(${dto.latitude} AS double precision)
          ),
          4326
        ),
        NOW(),
        NOW()
      )
      RETURNING
        id::text,
        title,
        slug,
        description,
        status::text as status,
        city,
        address,
        category,
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude,
        0::int as cameras_count,
        0::int as online_cameras_count,
        created_at,
        updated_at;
    `;

    return this.mapIntersection(rows[0]);
  }

  async findByBbox(dto: FindIntersectionsBboxDto) {
    const rows = await this.prisma.$queryRaw<IntersectionRow[]>`
      SELECT
        i.id::text,
        i.title,
        i.slug,
        i.description,
        i.status::text as status,
        i.city,
        i.address,
        i.category,
        ST_Y(i.location::geometry) as latitude,
        ST_X(i.location::geometry) as longitude,
        COUNT(c.id)::int as cameras_count,
        COUNT(c.id) FILTER (WHERE c.status = 'online'::camera_status)::int as online_cameras_count,
        i.created_at,
        i.updated_at
      FROM intersections i
      LEFT JOIN cameras c
        ON c.intersection_id = i.id
        AND c.deleted_at IS NULL
      WHERE i.deleted_at IS NULL
        AND i.status = 'active'::intersection_status
        AND ST_Intersects(
          i.location::geometry,
          ST_MakeEnvelope(
            ${dto.minLng},
            ${dto.minLat},
            ${dto.maxLng},
            ${dto.maxLat},
            4326
          )
        )
      GROUP BY i.id
      ORDER BY i.created_at DESC;
    `;

    return rows.map((row) => this.mapIntersection(row));
  }

  async findById(intersectionId: string) {
    const intersection = await this.findIntersectionById(intersectionId, true);

    if (!intersection) {
      throw new NotFoundException('Intersection not found');
    }

    return intersection;
  }

  async findAllAdmin() {
    const rows = await this.prisma.$queryRaw<IntersectionRow[]>`
      SELECT
        i.id::text,
        i.title,
        i.slug,
        i.description,
        i.status::text as status,
        i.city,
        i.address,
        i.category,
        ST_Y(i.location::geometry) as latitude,
        ST_X(i.location::geometry) as longitude,
        COUNT(c.id)::int as cameras_count,
        COUNT(c.id) FILTER (WHERE c.status = 'online'::camera_status)::int as online_cameras_count,
        i.created_at,
        i.updated_at
      FROM intersections i
      LEFT JOIN cameras c
        ON c.intersection_id = i.id
        AND c.deleted_at IS NULL
      WHERE i.deleted_at IS NULL
      GROUP BY i.id
      ORDER BY i.created_at DESC;
    `;

    return rows.map((row) => this.mapIntersection(row));
  }

  async findByIdAdmin(intersectionId: string) {
    const intersection = await this.findIntersectionById(intersectionId, false);

    if (!intersection) {
      throw new NotFoundException('Intersection not found');
    }

    return intersection;
  }

  async update(intersectionId: string, dto: UpdateIntersectionDto) {
    if (
      (dto.latitude === undefined && dto.longitude !== undefined) ||
      (dto.latitude !== undefined && dto.longitude === undefined)
    ) {
      throw new BadRequestException(
        'latitude and longitude must be provided together',
      );
    }

    const updates: Prisma.Sql[] = [];

    if (dto.title !== undefined) {
      updates.push(Prisma.sql`title = ${dto.title}`);
    }

    if (dto.slug !== undefined) {
      updates.push(Prisma.sql`slug = ${this.createSlug(dto.slug)}`);
    }

    if (dto.description !== undefined) {
      updates.push(Prisma.sql`description = ${dto.description}`);
    }

    if (dto.city !== undefined) {
      updates.push(Prisma.sql`city = ${dto.city}`);
    }

    if (dto.address !== undefined) {
      updates.push(Prisma.sql`address = ${dto.address}`);
    }

    if (dto.category !== undefined) {
      updates.push(Prisma.sql`category = ${dto.category}`);
    }

    if (dto.status !== undefined) {
      updates.push(
        Prisma.sql`status = CAST(${dto.status} AS intersection_status)`,
      );
    }

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      updates.push(Prisma.sql`
        location = ST_SetSRID(
          ST_MakePoint(
            CAST(${dto.longitude} AS double precision),
            CAST(${dto.latitude} AS double precision)
          ),
          4326
        )
      `);
    }

    if (updates.length > 0) {
      await this.prisma.$executeRaw(
        Prisma.sql`
          UPDATE intersections
          SET ${Prisma.join(updates, ', ')},
              updated_at = NOW()
          WHERE id = ${intersectionId}::uuid
            AND deleted_at IS NULL;
        `,
      );
    }

    return this.findByIdAdmin(intersectionId);
  }

  async delete(intersectionId: string) {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      UPDATE intersections
      SET deleted_at = NOW(),
          updated_at = NOW()
      WHERE id = ${intersectionId}::uuid
        AND deleted_at IS NULL
      RETURNING id::text;
    `;

    if (!rows[0]) {
      throw new NotFoundException('Intersection not found');
    }

    return {
      id: rows[0].id,
      deleted: true,
    };
  }

  async createCamera(intersectionId: string, dto: CreateIntersectionCameraDto) {
    const intersectionRows = await this.prisma.$queryRaw<
      {
        id: string;
        city: string | null;
        address: string | null;
        category: string | null;
        latitude: number;
        longitude: number;
      }[]
    >`
      SELECT
        id::text,
        city,
        address,
        category,
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude
      FROM intersections
      WHERE id = ${intersectionId}::uuid
        AND deleted_at IS NULL
      LIMIT 1;
    `;

    const intersection = intersectionRows[0];

    if (!intersection) {
      throw new NotFoundException('Intersection not found');
    }

    if (
      (dto.latitude === undefined && dto.longitude !== undefined) ||
      (dto.latitude !== undefined && dto.longitude === undefined)
    ) {
      throw new BadRequestException(
        'latitude and longitude must be provided together',
      );
    }

    const cameraId = randomUUID();
    const slug = this.createSlug(dto.title, dto.slug);

    const latitude =
      dto.latitude === undefined ? Number(intersection.latitude) : dto.latitude;

    const longitude =
      dto.longitude === undefined
        ? Number(intersection.longitude)
        : dto.longitude;

    const directionDeg =
      dto.directionDeg === undefined ? null : Number(dto.directionDeg);

    const fovDeg = dto.fovDeg ?? 90;
    const rangeMeters = dto.rangeMeters ?? 100;

    const normalizedConnection = this.normalizeRtspConnection(dto.connection);

    const encryptedRtspUrl = this.encryptionService.encrypt(
      normalizedConnection.rtspUrl,
    );

    const encryptedUsername = this.encryptNullable(
      normalizedConnection.username,
    );

    const encryptedPassword = this.encryptNullable(
      normalizedConnection.password,
    );

    const rows = await this.prisma.$transaction(async (tx) => {
      const cameraRows = await tx.$queryRaw<IntersectionCameraRow[]>`
        INSERT INTO cameras (
          id,
          title,
          slug,
          description,
          status,
          city,
          address,
          category,
          preview_url,
          location,
          direction_deg,
          fov_deg,
          range_meters,
          views_count,
          intersection_id,
          map_visible,
          created_at,
          updated_at
        )
        VALUES (
          ${cameraId}::uuid,
          ${dto.title},
          ${slug},
          ${dto.description ?? null},
          'offline'::camera_status,
          ${intersection.city},
          ${intersection.address},
          ${dto.category ?? intersection.category},
          ${null},
          ST_SetSRID(
            ST_MakePoint(
              CAST(${longitude} AS double precision),
              CAST(${latitude} AS double precision)
            ),
            4326
          ),
          ${directionDeg},
          CAST(${fovDeg} AS double precision),
          CAST(${rangeMeters} AS integer),
          0,
          ${intersectionId}::uuid,
          false,
          NOW(),
          NOW()
        )
        RETURNING
          id::text,
          title,
          slug,
          description,
          status::text as status,
          city,
          address,
          category,
          preview_url,
          ST_Y(location::geometry) as latitude,
          ST_X(location::geometry) as longitude,
          direction_deg,
          fov_deg,
          range_meters,
          views_count,
          created_at,
          updated_at;
      `;

      await tx.$executeRaw`
        INSERT INTO camera_connections (
          id,
          camera_id,
          encrypted_rtsp_url,
          encrypted_username,
          encrypted_password,
          created_at,
          updated_at
        )
        VALUES (
          ${randomUUID()}::uuid,
          ${cameraId}::uuid,
          ${encryptedRtspUrl},
          ${encryptedUsername},
          ${encryptedPassword},
          NOW(),
          NOW()
        );
      `;

      return cameraRows;
    });

    return this.mapIntersectionCamera(rows[0]);
  }

  async findCameras(intersectionId: string) {
    await this.ensureIntersectionExists(intersectionId);

    const rows = await this.findIntersectionCameraRows(intersectionId);

    return rows.map((row) => this.mapIntersectionCamera(row));
  }

  async findPublicCameras(intersectionId: string) {
    const intersection = await this.findIntersectionById(intersectionId, true);

    if (!intersection) {
      throw new NotFoundException('Intersection not found');
    }

    const rows = await this.findIntersectionCameraRows(intersectionId);

    return rows.map((row) => this.mapIntersectionCamera(row));
  }

  private async findIntersectionCameraRows(intersectionId: string) {
    return this.prisma.$queryRaw<IntersectionCameraRow[]>`
      SELECT
        c.id::text,
        c.title,
        c.slug,
        c.description,
        c.status::text as status,
        c.city,
        c.address,
        c.category,
        c.preview_url,
        ST_Y(c.location::geometry) as latitude,
        ST_X(c.location::geometry) as longitude,
        c.direction_deg,
        c.fov_deg,
        c.range_meters,
        c.views_count,
        c.created_at,
        c.updated_at
      FROM cameras c
      WHERE c.deleted_at IS NULL
        AND c.intersection_id = ${intersectionId}::uuid
      ORDER BY c.created_at DESC;
    `;
  }

  private async findIntersectionById(
    intersectionId: string,
    publicOnly: boolean,
  ) {
    const statusSql = publicOnly
      ? Prisma.sql`AND i.status = 'active'::intersection_status`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<IntersectionRow[]>(
      Prisma.sql`
        SELECT
          i.id::text,
          i.title,
          i.slug,
          i.description,
          i.status::text as status,
          i.city,
          i.address,
          i.category,
          ST_Y(i.location::geometry) as latitude,
          ST_X(i.location::geometry) as longitude,
          COUNT(c.id)::int as cameras_count,
          COUNT(c.id) FILTER (WHERE c.status = 'online'::camera_status)::int as online_cameras_count,
          i.created_at,
          i.updated_at
        FROM intersections i
        LEFT JOIN cameras c
          ON c.intersection_id = i.id
          AND c.deleted_at IS NULL
        WHERE i.id = ${intersectionId}::uuid
          AND i.deleted_at IS NULL
          ${statusSql}
        GROUP BY i.id
        LIMIT 1;
      `,
    );

    const row = rows[0];

    if (!row) {
      return null;
    }

    return this.mapIntersection(row);
  }

  private async ensureIntersectionExists(intersectionId: string) {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id::text
      FROM intersections
      WHERE id = ${intersectionId}::uuid
        AND deleted_at IS NULL
      LIMIT 1;
    `;

    if (!rows[0]) {
      throw new NotFoundException('Intersection not found');
    }
  }

  private mapIntersection(row: IntersectionRow) {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      status: row.status,
      city: row.city,
      address: row.address,
      category: row.category,
      coordinates: {
        lat: Number(row.latitude),
        lng: Number(row.longitude),
      },
      camerasCount: Number(row.cameras_count),
      onlineCamerasCount: Number(row.online_cameras_count),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapIntersectionCamera(row: IntersectionCameraRow) {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      status: row.status,
      city: row.city,
      address: row.address,
      category: row.category,
      previewUrl: row.preview_url,
      coordinates: {
        lat: Number(row.latitude),
        lng: Number(row.longitude),
      },
      coverage: {
        directionDeg:
          row.direction_deg === null ? null : Number(row.direction_deg),
        fovDeg: Number(row.fov_deg),
        rangeMeters: Number(row.range_meters),
      },
      viewsCount: Number(row.views_count),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private createSlug(title: string, slug?: string) {
    return (slug ?? title)
      .trim()
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '');
  }

  private normalizeRtspConnection(connection: {
    rtspUrl: string;
    username?: string;
    password?: string;
  }) {
    const url = new URL(connection.rtspUrl);

    const usernameFromUrl = url.username
      ? decodeURIComponent(url.username)
      : undefined;

    const passwordFromUrl = url.password
      ? decodeURIComponent(url.password)
      : undefined;

    url.username = '';
    url.password = '';

    return {
      rtspUrl: url.toString(),
      username: connection.username ?? usernameFromUrl,
      password: connection.password ?? passwordFromUrl,
    };
  }

  private encryptNullable(value?: string | null) {
    if (!value) {
      return null;
    }

    return this.encryptionService.encrypt(value);
  }
}