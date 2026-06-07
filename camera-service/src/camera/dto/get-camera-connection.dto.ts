import { IsUUID } from 'class-validator';

export class GetCameraConnectionDto {
  @IsUUID()
  cameraId!: string;
}