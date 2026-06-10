import { IsUUID } from 'class-validator';

export class FindCameraByIdDto {
  @IsUUID()
  cameraId!: string;
}