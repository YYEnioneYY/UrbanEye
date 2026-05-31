import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GetUserByIdDto } from './dto/get-user-by-id.dto';
import { UserService } from './user.service';
import { FindUsersDto } from './dto/find-users.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('user.get-by-id')
  getUserById(@Payload() dto: GetUserByIdDto) {
    return this.userService.getUserById(dto.id);
  }

  @MessagePattern('users.find_all')
  findAllUsers(@Payload() dto: FindUsersDto) {
    return this.userService.findAllUsers(dto);
  }
}