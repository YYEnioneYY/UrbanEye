import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CameraService } from './camera.service';
import { PublicCameraDto } from './dto/public-camera.dto';

@ApiTags('Cameras')
@Controller('cameras')
export class CameraController {
  constructor(private readonly cameraService: CameraService) {}

  @Get()
  @ApiOperation({ summary: 'Получить все камеры для карты' })
  @ApiOkResponse({ type: PublicCameraDto, isArray: true })
  findAll() {
    return this.cameraService.findAll();
  }
}