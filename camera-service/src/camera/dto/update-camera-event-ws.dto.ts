import { IsOptional, Matches } from 'class-validator';

export class UpdateCameraEventWsDto {
  @IsOptional()
  @Matches(/^wss?:\/\/.+/, {
    message: 'eventWsUrl must start with ws:// or wss://',
  })
  eventWsUrl?: string | null;
}