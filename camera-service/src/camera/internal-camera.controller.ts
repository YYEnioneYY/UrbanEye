import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { CameraService } from './camera.service';

@UseGuards(InternalApiKeyGuard)
@Controller('internal/cameras')
export class InternalCameraController {
  constructor(private readonly cameraService: CameraService) {}

  @Get(':cameraId/connection')
  getConnectionByCameraId(
    @Param('cameraId', new ParseUUIDPipe({ version: '4' }))
    cameraId: string,
  ) {
    return this.cameraService.getInternalConnectionByCameraId(cameraId);
  }
}