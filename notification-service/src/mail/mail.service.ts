import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

type SendMailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const password = this.configService.get<string>('SMTP_PASSWORD');

    if (!host || !user || !password) {
      this.logger.warn(
        'SMTP is not configured. Emails will be printed to console.',
      );

      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(this.configService.get('SMTP_PORT') ?? 465),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user,
        pass: password,
      },
    });
  }

  async sendMail(params: SendMailParams): Promise<void> {
    const fromName = this.configService.get('MAIL_FROM_NAME') ?? 'Окогид';
    const fromEmail =
      this.configService.get('MAIL_FROM_EMAIL') ??
      this.configService.get('SMTP_USER') ??
      'no-reply@okogid.local';

    if (!this.transporter) {
      this.logger.log('Email was not sent because SMTP is disabled.');
      this.logger.log(`To: ${params.to}`);
      this.logger.log(`Subject: ${params.subject}`);
      this.logger.log(params.text ?? params.html);
      return;
    }

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
  }
}