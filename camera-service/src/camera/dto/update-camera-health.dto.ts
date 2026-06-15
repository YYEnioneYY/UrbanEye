import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export enum CameraHealthStatusDto {
  unknown = 'unknown',
  online = 'online',
  offline = 'offline',
  unstable = 'unstable',
}

export class UpdateCameraHealthDto {
  @IsEnum(CameraHealthStatusDto)
  healthStatus!: CameraHealthStatusDto;

  @IsOptional()
  @IsString()
  videoCodec?: string | null;

  @IsOptional()
  @IsString()
  audioCodec?: string | null;

  @IsBoolean()
  transcodingRequired!: boolean;

  @IsOptional()
  @IsString()
  healthError?: string | null;
}

export class UpdateCameraHealthPayloadDto extends UpdateCameraHealthDto {
  @IsUUID()
  cameraId!: string;
}