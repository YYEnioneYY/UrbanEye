import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CameraStreamService } from './camera-stream.service';
import { CameraStreamResponseDto } from './dto/camera-stream-response.dto';
import { StreamStatusResponseDto } from './dto/stream-status-response.dto';

@ApiTags('Camera Stream')
@Controller()
export class CameraStreamController {
  constructor(private readonly cameraStreamService: CameraStreamService) {}

  @Get('streams/cameras/:cameraId')
  @ApiOperation({
    summary: 'Получить данные камеры + WebRTC/WHEP ссылки на поток',
  })
  @ApiParam({
    name: 'cameraId',
    example: '6bea819c-c577-422b-b432-3ca75028518f',
  })
  @ApiOkResponse({ type: CameraStreamResponseDto })
  getStreamByCameraId(
    @Param('cameraId', new ParseUUIDPipe({ version: '4' }))
    cameraId: string,
  ) {
    return this.cameraStreamService.getStreamByCameraId(cameraId);
  }

  @Get('streams/cameras/:cameraId/status')
  @ApiOperation({
    summary: 'Получить статус stream path в MediaMTX',
  })
  @ApiParam({
    name: 'cameraId',
    example: '6bea819c-c577-422b-b432-3ca75028518f',
  })
  @ApiOkResponse({ type: StreamStatusResponseDto })
  getStreamStatusByCameraId(
    @Param('cameraId', new ParseUUIDPipe({ version: '4' }))
    cameraId: string,
  ) {
    return this.cameraStreamService.getStreamStatusByCameraId(cameraId);
  }
}