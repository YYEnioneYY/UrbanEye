import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GetUserByIdDto } from './dto/get-user-by-id.dto';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('user.get-by-id')
  getUserById(@Payload() dto: GetUserByIdDto) {
    return this.userService.getUserById(dto.id);
  }
}