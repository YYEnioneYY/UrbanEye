import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { CameraService } from './camera.service';
import { UpdateCameraHealthDto } from './dto/update-camera-health.dto';
import { UpdateCameraPreviewDto } from './dto/update-camera-preview.dto';

class HealthCheckTargetsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 100;
}

@UseGuards(InternalApiKeyGuard)
@Controller('internal/cameras')
export class InternalCameraController {
  constructor(private readonly cameraService: CameraService) {}

  @Get('health-check-targets')
  getHealthCheckTargets(@Query() query: HealthCheckTargetsQueryDto) {
    return this.cameraService.getHealthCheckTargets(query.limit ?? 100);
  }

  @Get(':cameraId/connection')
  getConnectionByCameraId(
    @Param('cameraId', new ParseUUIDPipe({ version: '4' }))
    cameraId: string,
  ) {
    return this.cameraService.getInternalConnectionByCameraId(cameraId);
  }

  @Post(':cameraId/views')
  incrementViews(
    @Param('cameraId', new ParseUUIDPipe({ version: '4' }))
    cameraId: string,
  ) {
    return this.cameraService.incrementViews(cameraId);
  }

  @Patch(':cameraId/health')
  updateHealth(
    @Param('cameraId', new ParseUUIDPipe({ version: '4' }))
    cameraId: string,
    @Body() dto: UpdateCameraHealthDto,
  ) {
    return this.cameraService.updateInternalHealth(cameraId, dto);
  }

  @Get('preview-targets')
  getPreviewTargets(@Query() query: HealthCheckTargetsQueryDto) {
    return this.cameraService.getPreviewTargets(query.limit ?? 50);
  }
  
  @Patch(':cameraId/preview')
  updatePreview(
    @Param('cameraId', new ParseUUIDPipe({ version: '4' }))
    cameraId: string,
    @Body() dto: UpdateCameraPreviewDto,
  ) {
    return this.cameraService.updateInternalPreview(cameraId, dto.previewUrl);
  }
}