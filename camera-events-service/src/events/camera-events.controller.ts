import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { CameraEventsService } from './camera-events.service';

@Controller('camera-events')
export class CameraEventsController {
  constructor(private readonly cameraEventsService: CameraEventsService) {}

  @Get('cameras/:cameraId/latest')
  findLatestByCamera(
    @Param('cameraId', new ParseUUIDPipe({ version: '4' }))
    cameraId: string,
    @Query('limit') limit?: string,
  ) {
    return this.cameraEventsService.findLatestByCamera(
      cameraId,
      this.normalizeLimit(limit),
    );
  }

  @Get('intersections/:intersectionId/latest')
  findLatestByIntersection(
    @Param('intersectionId', new ParseUUIDPipe({ version: '4' }))
    intersectionId: string,
    @Query('limit') limit?: string,
  ) {
    return this.cameraEventsService.findLatestByIntersection(
      intersectionId,
      this.normalizeLimit(limit),
    );
  }

  private normalizeLimit(limit?: string) {
    const parsed = Number(limit ?? 30);

    if (!Number.isFinite(parsed)) {
      return 30;
    }

    return Math.min(Math.max(parsed, 1), 100);
  }
}