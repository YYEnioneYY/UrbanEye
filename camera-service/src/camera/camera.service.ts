import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PublicCamera } from './types/public-camera.type';

type CameraRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: 'online' | 'offline' | 'maintenance' | 'planned';
  city: string | null;
  address: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class CameraService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PublicCamera[]> {
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
      ORDER BY created_at DESC;
    `;

    return rows.map((row) => ({
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
    }));
  }
}