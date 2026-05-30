import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import type { AccessTokenPayload } from '../auth/types/jwt-payload.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Auth('user', 'admin')
  @ApiOperation({ summary: 'Получить текущего пользователя' })
  getMe(@CurrentUser() user: AccessTokenPayload) {
    return this.usersService.getUserById(user.sub);
  }
}