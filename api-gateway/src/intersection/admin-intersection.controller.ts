import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { CreateIntersectionCameraDto } from './dto/create-intersection-camera.dto';
import { CreateIntersectionDto } from './dto/create-intersection.dto';
import { UpdateIntersectionDto } from './dto/update-intersection.dto';
import { IntersectionService } from './intersection.service';

@ApiTags('Admin Intersections')
@ApiBearerAuth('access-token')
@Controller()
export class AdminIntersectionController {
  constructor(private readonly intersectionService: IntersectionService) {}

  @Post('admin/intersections')
  @Auth('admin')
  @ApiOperation({ summary: 'Создать перекрёсток' })
  create(@Body() dto: CreateIntersectionDto) {
    return this.intersectionService.create(dto);
  }

  @Get('admin/intersections')
  @Auth('admin')
  @ApiOperation({ summary: 'Получить все перекрёстки для админки' })
  findAll() {
    return this.intersectionService.findAllAdmin();
  }

  @Get('admin/intersections/:intersectionId')
  @Auth('admin')
  @ApiOperation({ summary: 'Получить перекрёсток по id для админки' })
  findByIdAdmin(
    @Param('intersectionId', new ParseUUIDPipe({ version: '4' }))
    intersectionId: string,
  ) {
    return this.intersectionService.findByIdAdmin(intersectionId);
  }

  @Patch('admin/intersections/:intersectionId')
  @Auth('admin')
  @ApiOperation({ summary: 'Обновить перекрёсток' })
  update(
    @Param('intersectionId', new ParseUUIDPipe({ version: '4' }))
    intersectionId: string,
    @Body() dto: UpdateIntersectionDto,
  ) {
    return this.intersectionService.update(intersectionId, dto);
  }

  @Delete('admin/intersections/:intersectionId')
  @Auth('admin')
  @ApiOperation({ summary: 'Удалить перекрёсток' })
  delete(
    @Param('intersectionId', new ParseUUIDPipe({ version: '4' }))
    intersectionId: string,
  ) {
    return this.intersectionService.delete(intersectionId);
  }

  @Post('admin/intersections/:intersectionId/cameras')
  @Auth('admin')
  @ApiOperation({
    summary:
      'Создать камеру внутри перекрёстка. На карте отдельной точкой она не появится.',
  })
  createCamera(
    @Param('intersectionId', new ParseUUIDPipe({ version: '4' }))
    intersectionId: string,
    @Body() dto: CreateIntersectionCameraDto,
  ) {
    return this.intersectionService.createCamera(intersectionId, dto);
  }

  @Get('admin/intersections/:intersectionId/cameras')
  @Auth('admin')
  @ApiOperation({ summary: 'Получить камеры перекрёстка для админки' })
  findCameras(
    @Param('intersectionId', new ParseUUIDPipe({ version: '4' }))
    intersectionId: string,
  ) {
    return this.intersectionService.findCameras(intersectionId);
  }
}