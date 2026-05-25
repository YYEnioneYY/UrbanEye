import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import * as argon2 from 'argon2';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PublicUser, publicUserSelect } from './user.select';

@Injectable()
export class UserService {
  private readonly argon2MemoryCost: number;
  private readonly argon2TimeCost: number;
  private readonly argon2Parallelism: number;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.argon2MemoryCost = Number(
      configService.get('ARGON2_MEMORY_COST') ?? 65536,
    );

    this.argon2TimeCost = Number(configService.get('ARGON2_TIME_COST') ?? 3);

    this.argon2Parallelism = Number(
      configService.get('ARGON2_PARALLELISM') ?? 4,
    );
  }

  async createUser(dto: CreateUserDto): Promise<PublicUser> {
    const email = dto.email.toLowerCase().trim();

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: this.argon2MemoryCost,
      timeCost: this.argon2TimeCost,
      parallelism: this.argon2Parallelism,
    });

    try {
      return await this.prisma.user.create({
        data: {
          email,
          passwordHash,
        },
        select: publicUserSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new RpcException({
          statusCode: 409,
          code: 'USER_ALREADY_EXISTS',
          message: 'User with this email already exists',
        });
      }

      throw new RpcException({
        statusCode: 500,
        code: 'USER_CREATE_FAILED',
        message: 'Failed to create user',
      });
    }
  }

  async getUserById(id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: publicUserSelect,
    });

    if (!user) {
      throw new RpcException({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    return user;
  }
}