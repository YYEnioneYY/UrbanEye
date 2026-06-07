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
  created_at: Date;
  updated_at: Date;
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
} 