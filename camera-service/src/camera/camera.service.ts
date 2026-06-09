import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';
import { EncryptionService } from '../encryption/encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCameraDto } from './dto/create-camera.dto';
import { FindAdminCamerasDto } from './dto/find-admin-cameras.dto';
import { FindCamerasByBboxDto } from './dto/find-cameras-by-bbox.dto';
import { PublicCamera } from './types/public-camera.type';
import { NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { FindPublicCamerasDto } from './dto/find-public-cameras.dto';
import { FindCamerasLookingAtPointDto } from './dto/find-cameras-looking-at-point.dto';

type CameraStatus = 'online' | 'offline' | 'maintenance' | 'planned';

type CameraRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: CameraStatus;
  city: string | null;
  address: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  direction_deg: number | null;
  fov_deg: number;
  range_meters: number;
  created_at: Date;
  updated_at: Date;
};

type CameraLookingAtRow = CameraRow & {
  distance_m: number;
  bearing_deg: number;
  angle_diff_deg: number;
};

type AdminCameraRow = CameraRow & {
  deleted_at: Date | null;
  encrypted_rtsp_url: string | null;
  encrypted_username: string | null;
  encrypted_password: string | null;
};

type CountRow = {
  total: number;
};

@Injectable()
export class CameraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(dto: CreateCameraDto): Promise<PublicCamera> {
    const cameraId = randomUUID();
    const slug = this.createSlug(dto.title, dto.slug);
    
    const status = dto.status ?? 'planned';
    const latitude = Number(dto.latitude);
    const longitude = Number(dto.longitude);

    const directionDeg =
      dto.directionDeg === undefined ? null : Number(dto.directionDeg);

    const fovDeg = dto.fovDeg ?? 90;
    const rangeMeters = dto.rangeMeters ?? 100;
    
    try {
      return await this.prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<CameraRow[]>`
          INSERT INTO cameras (
            id,
            title,
            slug,
            description,
            status,
            city,
            address,
            category,
            location,
            direction_deg,
            fov_deg,
            range_meters,
            created_at,
            updated_at
          )
          VALUES (
            ${cameraId}::uuid,
            ${dto.title},
            ${slug},
            ${dto.description ?? null},
            CAST(${status} AS camera_status),
            ${dto.city ?? null},
            ${dto.address ?? null},
            ${dto.category ?? null},
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
            direction_deg,
            fov_deg,
            range_meters,
            created_at,
            updated_at;
        `;
      
        const camera = rows[0];
      
        await tx.cameraConnection.create({
          data: {
            cameraId: camera.id,
            encryptedRtspUrl: this.encryptionService.encrypt(
              dto.connection.rtspUrl,
            )!,
            encryptedUsername: this.encryptionService.encrypt(
              dto.connection.username,
            ),
            encryptedPassword: this.encryptionService.encrypt(
              dto.connection.password,
            ),
          },
        });
      
        return this.mapPublicCamera(camera);
      });
    } catch (error) {
      const err = error as any;
    
      console.error('[camera-service] create camera failed:', {
        message: err?.message,
        code: err?.code,
        meta: err?.meta,
        stack: err?.stack,
      });
    
      throw new RpcException({
        statusCode: 400,
        code: 'CAMERA_CREATE_FAILED',
        message:
          err?.meta?.message ??
          err?.message ??
          'Failed to create camera',
      });
    }
  }

  async findByBbox(dto: FindCamerasByBboxDto): Promise<PublicCamera[]> {
    if (dto.minLng >= dto.maxLng || dto.minLat >= dto.maxLat) {
      throw new RpcException({
        statusCode: 400,
        code: 'INVALID_BBOX',
        message: 'Invalid bbox coordinates',
      });
    }

    const rows = await this.prisma.$queryRaw<CameraRow[]>`
      SELECT
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
        direction_deg,
        fov_deg,
        range_meters,
        created_at,
        updated_at
      FROM cameras
      WHERE deleted_at IS NULL
        AND ST_Intersects(
          location::geometry,
          ST_MakeEnvelope(${dto.minLng}, ${dto.minLat}, ${dto.maxLng}, ${dto.maxLat}, 4326)
        )
      ORDER BY created_at DESC;
    `;

    return rows.map((row) => this.mapPublicCamera(row));
  }

  async findAllAdmin(dto: FindAdminCamerasDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const conditions: Prisma.Sql[] = [];

    if (!dto.includeDeleted) {
      conditions.push(Prisma.sql`c.deleted_at IS NULL`);
    }

    if (dto.search?.trim()) {
      const search = `%${dto.search.trim()}%`;

      conditions.push(Prisma.sql`
        (
          c.title ILIKE ${search}
          OR c.slug ILIKE ${search}
          OR c.city ILIKE ${search}
          OR c.address ILIKE ${search}
          OR c.category ILIKE ${search}
        )
      `);
    }

    const whereSql =
      conditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
        : Prisma.empty;

    const rows = await this.prisma.$queryRaw<AdminCameraRow[]>(Prisma.sql`
      SELECT
        c.id::text,
        c.title,
        c.slug,
        c.description,
        c.status::text as status,
        c.city,
        c.address,
        c.category,
        ST_Y(c.location::geometry) as latitude,
        ST_X(c.location::geometry) as longitude,
        c.direction_deg,
        c.fov_deg,
        c.range_meters,
        c.created_at,
        c.updated_at,
        c.deleted_at,
        cc.encrypted_rtsp_url,
        cc.encrypted_username,
        cc.encrypted_password
      FROM cameras c
      LEFT JOIN camera_connections cc ON cc.camera_id = c.id
      ${whereSql}
      ORDER BY c.created_at DESC
      LIMIT ${limit}
      OFFSET ${skip};
    `);

    const countRows = await this.prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT COUNT(*)::int as total
      FROM cameras c
      ${whereSql};
    `);

    const total = countRows[0]?.total ?? 0;

    return {
      data: rows.map((row) => ({
        ...this.mapPublicCamera(row),
        deletedAt: row.deleted_at,
        connection: {
          rtspUrl: this.encryptionService.decrypt(row.encrypted_rtsp_url),
          username: this.encryptionService.decrypt(row.encrypted_username),
          password: this.encryptionService.decrypt(row.encrypted_password),
        },
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  private mapPublicCamera(row: CameraRow): PublicCamera {
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
      coverage: {
        directionDeg:
          row.direction_deg === null ? null : Number(row.direction_deg),
        fovDeg: Number(row.fov_deg),
        rangeMeters: Number(row.range_meters),
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private createSlug(title: string, slug?: string): string {
    const source = slug?.trim() || title.trim();

    const result = source
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, '-')
      .replace(/^-+|-+$/g, '');

    return result || `camera-${Date.now()}`;
  }

  async getInternalConnectionByCameraId(cameraId: string) {
    const camera = await this.prisma.camera.findFirst({
      where: {
        id: cameraId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        status: true,
        city: true,
        address: true,
        category: true,
        directionDeg: true,
        fovDeg: true,
        rangeMeters: true,
        createdAt: true,
        updatedAt: true,
        connection: {
          select: {
            encryptedRtspUrl: true,
            encryptedUsername: true,
            encryptedPassword: true,
          },
        },
      },
    });

    if (!camera || !camera.connection) {
      throw new NotFoundException('Camera connection not found');
    }

    const rows = await this.prisma.$queryRaw<
      {
        latitude: number;
        longitude: number;
      }[]
    >`
      SELECT
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude
      FROM cameras
      WHERE id = ${cameraId}::uuid
        AND deleted_at IS NULL
      LIMIT 1;
    `;

    const coordinates = rows[0];

    if (!coordinates) {
      throw new NotFoundException('Camera not found');
    }

    return {
      camera: {
        id: camera.id,
        title: camera.title,
        slug: camera.slug,
        description: camera.description,
        status: camera.status,
        city: camera.city,
        address: camera.address,
        category: camera.category,
        coordinates: {
          lat: Number(coordinates.latitude),
          lng: Number(coordinates.longitude),
        },
        coverage: {
          directionDeg: camera.directionDeg,
          fovDeg: camera.fovDeg,
          rangeMeters: camera.rangeMeters,
        },
        createdAt: camera.createdAt,
        updatedAt: camera.updatedAt,
      },
      streamPath: camera.slug,
      connection: {
        rtspUrl: this.encryptionService.decrypt(
          camera.connection.encryptedRtspUrl,
        ),
        username: this.encryptionService.decrypt(
          camera.connection.encryptedUsername,
        ),
        password: this.encryptionService.decrypt(
          camera.connection.encryptedPassword,
        ),
      },
    };
  }

  async findAllPublic(dto: FindPublicCamerasDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;
    
    const conditions: Prisma.Sql[] = [
      Prisma.sql`c.deleted_at IS NULL`,
    ];
  
    if (dto.search?.trim()) {
      const search = `%${dto.search.trim()}%`;
    
      conditions.push(Prisma.sql`
        (
          c.title ILIKE ${search}
          OR c.slug ILIKE ${search}
          OR c.city ILIKE ${search}
          OR c.address ILIKE ${search}
          OR c.category ILIKE ${search}
        )
      `);
    }
  
    if (dto.status) {
      conditions.push(Prisma.sql`
        c.status = CAST(${dto.status} AS camera_status)
      `);
    }
  
    if (dto.city?.trim()) {
      conditions.push(Prisma.sql`
        c.city ILIKE ${`%${dto.city.trim()}%`}
      `);
    }
  
    if (dto.category?.trim()) {
      conditions.push(Prisma.sql`
        c.category ILIKE ${`%${dto.category.trim()}%`}
      `);
    }
  
    const whereSql = Prisma.sql`
      WHERE ${Prisma.join(conditions, ' AND ')}
    `;
  
    const rows = await this.prisma.$queryRaw<CameraRow[]>(Prisma.sql`
      SELECT
        c.id::text,
        c.title,
        c.slug,
        c.description,
        c.status::text as status,
        c.city,
        c.address,
        c.category,
        ST_Y(c.location::geometry) as latitude,
        ST_X(c.location::geometry) as longitude,
        c.direction_deg,
        c.fov_deg,
        c.range_meters,
        c.created_at,
        c.updated_at
      FROM cameras c
      ${whereSql}
      ORDER BY c.created_at DESC
      LIMIT ${limit}
      OFFSET ${skip};
    `);
    
    const countRows = await this.prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT COUNT(*)::int as total
      FROM cameras c
      ${whereSql};
    `);
    
    const total = countRows[0]?.total ?? 0;
    
    return {
      data: rows.map((row) => this.mapPublicCamera(row)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findLookingAtPoint(dto: FindCamerasLookingAtPointDto) {
    const targetLat = Number(dto.lat);
    const targetLng = Number(dto.lng);
    
    const rows = await this.prisma.$queryRaw<CameraLookingAtRow[]>(Prisma.sql`
      WITH target AS (
        SELECT ST_SetSRID(
          ST_MakePoint(
            CAST(${targetLng} AS double precision),
            CAST(${targetLat} AS double precision)
          ),
          4326
        ) AS geom
      ),
      calc AS (
        SELECT
          c.id::text,
          c.title,
          c.slug,
          c.description,
          c.status::text as status,
          c.city,
          c.address,
          c.category,
          ST_Y(c.location::geometry) as latitude,
          ST_X(c.location::geometry) as longitude,
          c.direction_deg,
          c.fov_deg,
          c.range_meters,
          c.created_at,
          c.updated_at,
    
          ST_Distance(
            c.location::geography,
            target.geom::geography
          ) as distance_m,
    
          COALESCE(
            degrees(ST_Azimuth(c.location::geometry, target.geom)),
            c.direction_deg
          ) as bearing_deg
        FROM cameras c
        CROSS JOIN target
        WHERE c.deleted_at IS NULL
          AND c.direction_deg IS NOT NULL
          AND ST_DWithin(
            c.location::geography,
            target.geom::geography,
            c.range_meters
          )
      ),
      final AS (
        SELECT
          *,
          ABS(
            MOD(
              CAST((bearing_deg - direction_deg + 540) AS numeric),
              360
            )::double precision - 180
          ) as angle_diff_deg
        FROM calc
      )
      SELECT *
      FROM final
      WHERE angle_diff_deg <= fov_deg / 2
      ORDER BY distance_m ASC;
    `);
    
    return rows.map((row) => ({
      ...this.mapPublicCamera(row),
      viewMatch: {
        distanceMeters: Math.round(Number(row.distance_m) * 100) / 100,
        bearingDeg: Math.round(Number(row.bearing_deg) * 100) / 100,
        angleDiffDeg: Math.round(Number(row.angle_diff_deg) * 100) / 100,
      },
    }));
  }
} 