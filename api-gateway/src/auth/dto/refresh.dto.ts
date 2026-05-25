import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshDto {
  @ApiPropertyOptional({
    description: 'Можно не передавать, если refreshToken уже лежит в cookie',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}