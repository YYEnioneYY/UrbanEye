import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUserDto {
  @ApiProperty({ example: '4a267a53-10d1-47cc-8f01-12b0363aa6e2' })
  id!: string;

  @ApiProperty({ example: 'user@mail.com' })
  email!: string;

  @ApiProperty({ example: 'user', enum: ['user', 'admin'] })
  role!: 'user' | 'admin';

  @ApiProperty({ example: '2026-05-27T18:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-05-27T18:00:00.000Z' })
  updatedAt!: string;

  @ApiPropertyOptional({ example: null, nullable: true })
  deletedAt!: string | null;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 150 })
  total!: number;

  @ApiProperty({ example: 8 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNextPage!: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage!: boolean;
}

export class UsersListResponseDto {
  @ApiProperty({ type: AdminUserDto, isArray: true })
  data!: AdminUserDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}