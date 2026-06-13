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
import { BadRequestException } from '@nestjs/common';
import { UpdateCameraPayloadDto } from './dto/update-camera.dto';

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
            preview_url,
            location,
            direction_deg,
            fov_deg,
            range_meters,
            views_count,
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
            ${dto.previewUrl ?? null},
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
        preview_url,
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude,
        direction_deg,
        fov_deg,
        range_meters,
        views_count,
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
        c.preview_url,
        ST_Y(c.location::geometry) as latitude,
        ST_X(c.location::geometry) as longitude,
        c.direction_deg,
        c.fov_deg,
        c.range_meters,
        c.views_count,
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
        preview_url: true,
        viewsCount: true,
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
        preview_url: camera.preview_url,
        coordinates: {
          lat: Number(coordinates.latitude),
          lng: Number(coordinates.longitude),
        },
        coverage: {
          directionDeg: camera.directionDeg,
          fovDeg: camera.fovDeg,
          rangeMeters: camera.rangeMeters,
        },
        viewsCount: camera.viewsCount,
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

  private normalizeRtspConnection(connection: {
    rtspUrl?: string;
    username?: string;
    password?: string;
  }) {
    if (!connection.rtspUrl) {
      return {
        rtspUrl: undefined,
        username: connection.username,
        password: connection.password,
      };
    }

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

  async findAllPublic(dto: FindPublicCamerasDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;
    
    const conditions: Prisma.Sql[] = [Prisma.sql`c.deleted_at IS NULL`];
    
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
  
    const orderBySql =
      dto.viewsSort === 'most'
        ? Prisma.sql`c.views_count DESC, c.created_at DESC`
        : dto.viewsSort === 'least'
          ? Prisma.sql`c.views_count ASC, c.created_at DESC`
          : Prisma.sql`c.created_at DESC`;
  
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
      ${whereSql}
      ORDER BY ${orderBySql}
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
          c.preview_url,
          ST_Y(c.location::geometry) as latitude,
          ST_X(c.location::geometry) as longitude,
          c.direction_deg,
          c.fov_deg,
          c.range_meters,
          c.views_count,
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

  async incrementViews(cameraId: string) {
    const rows = await this.prisma.$queryRaw<
      {
        id: string;
        views_count: number;
      }[]
    >`
      UPDATE cameras
      SET views_count = views_count + 1,
          updated_at = NOW()
      WHERE id = ${cameraId}::uuid
        AND deleted_at IS NULL
      RETURNING id::text, views_count;
    `;

    const camera = rows[0];

    if (!camera) {
      throw new NotFoundException('Camera not found');
    }

    return {
      cameraId: camera.id,
      viewsCount: Number(camera.views_count),
    };
  }

  async findById(cameraId: string): Promise<PublicCamera> {
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
      WHERE c.id = CAST(${cameraId} AS uuid)
        AND c.deleted_at IS NULL
      LIMIT 1;
    `);

    const camera = rows[0];

    if (!camera) {
      throw new RpcException({
        statusCode: 404,
        code: 'CAMERA_NOT_FOUND',
        message: 'Camera not found',
      });
    }

    return this.mapPublicCamera(camera);
  }

  async update(
    cameraId: string,
    dto: UpdateCameraPayloadDto,
  ): Promise<PublicCamera> {
    const hasLatitude = dto.latitude !== undefined;
    const hasLongitude = dto.longitude !== undefined;

    if (hasLatitude !== hasLongitude) {
      throw new RpcException({
        statusCode: 400,
        code: 'CAMERA_COORDINATES_INVALID',
        message: 'latitude and longitude must be provided together',
      });
    }

    const updates: Prisma.Sql[] = [];

    if (dto.title !== undefined) {
      updates.push(Prisma.sql`title = ${dto.title}`);
    }

    if (dto.slug !== undefined) {
      updates.push(Prisma.sql`slug = ${dto.slug}`);
    }

    if (dto.description !== undefined) {
      updates.push(Prisma.sql`description = ${dto.description}`);
    }

    if (dto.status !== undefined) {
      updates.push(Prisma.sql`status = CAST(${dto.status} AS camera_status)`);
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

    if (dto.previewUrl !== undefined) {
      updates.push(Prisma.sql`preview_url = ${dto.previewUrl}`);
    }

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      updates.push(Prisma.sql`
        location = ST_SetSRID(
          ST_MakePoint(
            CAST(${Number(dto.longitude)} AS double precision),
            CAST(${Number(dto.latitude)} AS double precision)
          ),
          4326
        )
      `);
    }

    if (dto.directionDeg !== undefined) {
      updates.push(
        Prisma.sql`direction_deg = CAST(${Number(dto.directionDeg)} AS double precision)`,
      );
    }

    if (dto.fovDeg !== undefined) {
      updates.push(
        Prisma.sql`fov_deg = CAST(${Number(dto.fovDeg)} AS double precision)`,
      );
    }

    if (dto.rangeMeters !== undefined) {
      updates.push(
        Prisma.sql`range_meters = CAST(${Number(dto.rangeMeters)} AS integer)`,
      );
    }

    const hasCameraUpdates = updates.length > 0;
    const hasConnectionUpdates =
      dto.connection &&
      (dto.connection.rtspUrl !== undefined ||
        dto.connection.username !== undefined ||
        dto.connection.password !== undefined);

    if (!hasCameraUpdates && !hasConnectionUpdates) {
      throw new RpcException({
        statusCode: 400,
        code: 'CAMERA_UPDATE_EMPTY',
        message: 'No fields provided for update',
      });
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (hasCameraUpdates) {
          updates.push(Prisma.sql`updated_at = NOW()`);

          const updatedRows = await tx.$queryRaw<CameraRow[]>(Prisma.sql`
            UPDATE cameras
            SET ${Prisma.join(updates, ', ')}
            WHERE id = ${cameraId}::uuid
              AND deleted_at IS NULL
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
          `);

          if (!updatedRows[0]) {
            throw new RpcException({
              statusCode: 404,
              code: 'CAMERA_NOT_FOUND',
              message: 'Camera not found',
            });
          }
        } else {
          const exists = await tx.camera.findFirst({
            where: {
              id: cameraId,
              deletedAt: null,
            },
            select: {
              id: true,
            },
          });

          if (!exists) {
            throw new RpcException({
              statusCode: 404,
              code: 'CAMERA_NOT_FOUND',
              message: 'Camera not found',
            });
          }
        }

        if (hasConnectionUpdates && dto.connection) {
          const normalizedConnection = this.normalizeRtspConnection(
            dto.connection,
          );

          const connectionUpdates: Prisma.Sql[] = [];

          if (normalizedConnection.rtspUrl !== undefined) {
            connectionUpdates.push(
              Prisma.sql`encrypted_rtsp_url = ${this.encryptionService.encrypt(
                normalizedConnection.rtspUrl,
              )}`,
            );
          }

          if (normalizedConnection.username !== undefined) {
            connectionUpdates.push(
              Prisma.sql`encrypted_username = ${this.encryptionService.encrypt(
                normalizedConnection.username,
              )}`,
            );
          }

          if (normalizedConnection.password !== undefined) {
            connectionUpdates.push(
              Prisma.sql`encrypted_password = ${this.encryptionService.encrypt(
                normalizedConnection.password,
              )}`,
            );
          }

          if (connectionUpdates.length > 0) {
            connectionUpdates.push(Prisma.sql`updated_at = NOW()`);

            await tx.$executeRaw(Prisma.sql`
              UPDATE camera_connections
              SET ${Prisma.join(connectionUpdates, ', ')}
              WHERE camera_id = ${cameraId}::uuid;
            `);
          }
        }

        return this.findByIdInTransaction(tx, cameraId);
      });
    } catch (error) {
      const err = error as any;

      if (err instanceof RpcException) {
        throw err;
      }

      console.error('[camera-service] update camera failed:', {
        message: err?.message,
        code: err?.code,
        meta: err?.meta,
        stack: err?.stack,
      });

      if (err?.code === '23505') {
        throw new RpcException({
          statusCode: 409,
          code: 'CAMERA_SLUG_ALREADY_EXISTS',
          message: 'Camera slug already exists',
        });
      }

      throw new RpcException({
        statusCode: 400,
        code: 'CAMERA_UPDATE_FAILED',
        message:
          err?.meta?.message ??
          err?.message ??
          'Failed to update camera',
      });
    }
  }

  private async findByIdInTransaction(
    tx: Prisma.TransactionClient,
    cameraId: string,
  ): Promise<PublicCamera> {
    const rows = await tx.$queryRaw<CameraRow[]>(Prisma.sql`
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
      WHERE c.id = ${cameraId}::uuid
        AND c.deleted_at IS NULL
      LIMIT 1;
    `);

    const camera = rows[0];

    if (!camera) {
      throw new RpcException({
        statusCode: 404,
        code: 'CAMERA_NOT_FOUND',
        message: 'Camera not found',
      });
    }

    return this.mapPublicCamera(camera);
  }

  async delete(cameraId: string) {
    try {
      const rows = await this.prisma.$queryRaw<
        {
          id: string;
          deleted_at: Date;
        }[]
      >`
        UPDATE cameras
        SET deleted_at = NOW(),
            updated_at = NOW()
        WHERE id = ${cameraId}::uuid
          AND deleted_at IS NULL
        RETURNING id::text, deleted_at;
      `;
      
      const camera = rows[0];
      
      if (!camera) {
        throw new RpcException({
          statusCode: 404,
          code: 'CAMERA_NOT_FOUND',
          message: 'Camera not found',
        });
      }
    
      return {
        cameraId: camera.id,
        deletedAt: camera.deleted_at,
      };
    } catch (error) {
      const err = error as any;
    
      if (err instanceof RpcException) {
        throw err;
      }
    
      console.error('[camera-service] delete camera failed:', {
        message: err?.message,
        code: err?.code,
        meta: err?.meta,
        stack: err?.stack,
      });
    
      throw new RpcException({
        statusCode: 400,
        code: 'CAMERA_DELETE_FAILED',
        message:
          err?.meta?.message ??
          err?.message ??
          'Failed to delete camera',
      });
    }
  }
}   