import { IsEmail } from 'class-validator';

export class AccountCreatedDto {
  @IsEmail()
  email!: string;
}