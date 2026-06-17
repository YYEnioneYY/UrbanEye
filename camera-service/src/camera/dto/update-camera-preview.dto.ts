import { IsUrl } from 'class-validator';

export class UpdateCameraPreviewDto {
  @IsUrl({ require_tld: false })
  previewUrl!: string;
}