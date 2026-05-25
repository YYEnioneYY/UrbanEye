import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { AccountCreatedDto } from './dto/account-created.dto';
import { PasswordResetDto } from './dto/password-reset.dto';
import { NotificationService } from './notification.service';

@UseGuards(InternalApiKeyGuard)
@Controller('internal/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('account-created')
  async sendAccountCreated(@Body() dto: AccountCreatedDto) {
    await this.notificationService.sendAccountCreated(dto);

    return {
      success: true,
    };
  }

  @Post('password-reset')
  async sendPasswordReset(@Body() dto: PasswordResetDto) {
    await this.notificationService.sendPasswordReset(dto);

    return {
      success: true,
    };
  }
}