import { IsUUID } from 'class-validator';

export class DeleteCameraDto {
  @IsUUID()
  cameraId!: string;
}