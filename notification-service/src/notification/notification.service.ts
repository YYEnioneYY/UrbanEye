import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { AccountCreatedDto } from './dto/account-created.dto';
import { PasswordResetDto } from './dto/password-reset.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async sendAccountCreated(dto: AccountCreatedDto): Promise<void> {
    await this.mailService.sendMail({
      to: dto.email,
      subject: 'Аккаунт создан',
      text: `Ваш аккаунт успешно создан.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Аккаунт создан</h2>
          <p>Ваш аккаунт в Окогид успешно создан.</p>
          <p>Теперь вы можете войти в систему и пользоваться сервисом.</p>
        </div>
      `,
    });
  }

  async sendPasswordReset(dto: PasswordResetDto): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

    const resetUrl = `${frontendUrl}/reset-password?token=${dto.resetToken}`;

    await this.mailService.sendMail({
      to: dto.email,
      subject: 'Сброс пароля',
      text: `Для сброса пароля перейдите по ссылке: ${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Сброс пароля</h2>
          <p>Вы запросили сброс пароля для аккаунта в Окогид.</p>
          <p>Нажмите на кнопку ниже, чтобы задать новый пароль:</p>

          <p>
            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                padding: 12px 18px;
                background: #FFD21E;
                color: #0F1318;
                text-decoration: none;
                border-radius: 10px;
                font-weight: 700;
              "
            >
              Сбросить пароль
            </a>
          </p>

          <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
        </div>
      `,
    });
  }
}