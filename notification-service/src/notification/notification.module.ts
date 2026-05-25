import { Module } from '@nestjs/common';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { MailModule } from '../mail/mail.module';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [MailModule],
  controllers: [NotificationController],
  providers: [NotificationService, InternalApiKeyGuard],
})
export class NotificationModule {}