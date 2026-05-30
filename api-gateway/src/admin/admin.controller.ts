import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { AdminService } from './admin.service';
import { AuthServiceStatusDto } from './dto/auth-service-status.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('services/auth/status')
  @Auth('admin')
  @ApiOperation({
    summary: 'Получить статус и базовую нагрузку auth-service',
  })
  @ApiOkResponse({ type: AuthServiceStatusDto })
  getAuthServiceStatus() {
    return this.adminService.getAuthServiceStatus();
  }
}