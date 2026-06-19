import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindIntersectionsBboxDto } from './dto/find-intersections-bbox.dto';
import { IntersectionService } from './intersection.service';

@ApiTags('Intersections')
@Controller()
export class IntersectionController {
  constructor(private readonly intersectionService: IntersectionService) {}

  @Get('intersections/bbox')
  @ApiOperation({
    summary: 'Получить перекрёстки в пределах bbox для отображения на карте',
  })
  findByBbox(@Query() query: FindIntersectionsBboxDto) {
    return this.intersectionService.findByBbox(query);
  }

  @Get('intersections/:intersectionId')
  @ApiOperation({
    summary: 'Получить публичную карточку перекрёстка',
  })
  findById(
    @Param('intersectionId', new ParseUUIDPipe({ version: '4' }))
    intersectionId: string,
  ) {
    return this.intersectionService.findById(intersectionId);
  }

  @Get('intersections/:intersectionId/streams')
  @ApiOperation({
    summary: 'Получить все stream URL камер перекрёстка',
  })
  findStreams(
    @Param('intersectionId', new ParseUUIDPipe({ version: '4' }))
    intersectionId: string,
  ) {
    return this.intersectionService.findStreams(intersectionId);
  }
}