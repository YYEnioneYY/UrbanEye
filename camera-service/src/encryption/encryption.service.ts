import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.getOrThrow<string>(
      'CAMERA_CONNECTION_ENCRYPTION_KEY',
    );

    this.key = Buffer.from(key, 'base64');

    if (this.key.length !== 32) {
      throw new Error(
        'CAMERA_CONNECTION_ENCRYPTION_KEY must be 32 bytes in base64',
      );
    }
  }

  encrypt(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const iv = randomBytes(12);

    const cipher = createCipheriv('aes-256-gcm', this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return [
      iv.toString('base64'),
      tag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  decrypt(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const [ivBase64, tagBase64, encryptedBase64] = value.split(':');

    const iv = Buffer.from(ivBase64, 'base64');
    const tag = Buffer.from(tagBase64, 'base64');
    const encrypted = Buffer.from(encryptedBase64, 'base64');

    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);

    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}