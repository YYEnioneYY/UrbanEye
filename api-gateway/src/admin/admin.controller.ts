import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { AdminService } from './admin.service';
import { AuthServiceStatusDto } from './dto/auth-service-status.dto';
import { Query } from '@nestjs/common';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UsersListResponseDto } from './dto/users-list-response.dto';

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

  @Get('users')
  @Auth('admin')
  @ApiOperation({
    summary: 'Получить список всех пользователей с пагинацией',
  })
  @ApiOkResponse({ type: UsersListResponseDto })
  getUsers(@Query() query: FindUsersQueryDto) {
    return this.adminService.getUsers(query);
  }
}