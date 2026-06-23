import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class UpdateCameraEventWsDto {
  @ApiPropertyOptional({
    example: 'ws://192.168.1.50:8080/events',
    description:
      'WebSocket-ссылка, откуда camera-events-service будет получать события камеры. Чтобы отключить — отправь null.',
    nullable: true,
  })
  @IsOptional()
  @Matches(/^wss?:\/\/.+/, {
    message: 'eventWsUrl must start with ws:// or wss://',
  })
  eventWsUrl?: string | null;
}