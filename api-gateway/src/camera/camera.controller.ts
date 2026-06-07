import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { CameraService } from './camera.service';
import { AdminCameraQueryDto } from './dto/admin-camera-query.dto';
import { CameraBboxQueryDto } from './dto/camera-bbox-query.dto';
import { CreateCameraDto } from './dto/create-camera.dto';
import { PublicCameraDto } from './dto/public-camera.dto';

@ApiTags('Cameras')
@Controller()
export class CameraController {
  constructor(private readonly cameraService: CameraService) {}

  @Post('admin/cameras')
  @Auth('admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Добавить новую камеру' })
  @ApiCreatedResponse({ type: PublicCameraDto })
  create(@Body() dto: CreateCameraDto) {
    return this.cameraService.create(dto);
  }

  @Get('cameras/bbox')
  @ApiOperation({ summary: 'Получить камеры в области карты bbox' })
  @ApiOkResponse({ type: PublicCameraDto, isArray: true })
  findByBbox(@Query() query: CameraBboxQueryDto) {
    return this.cameraService.findByBbox(query);
  }

  @Get('admin/cameras')
  @Auth('admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Получить все камеры для админки с секретами и пагинацией',
  })
  findAllAdmin(@Query() query: AdminCameraQueryDto) {
    return this.cameraService.findAllAdmin(query);
  }
}