import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ example: 'zubabuba11', description: 'Логин пользователя' })
  @IsString({ message: 'Должен быть строкой' })
  @Length(4, 16, { message: 'Не меньше 4 и не больше 16 символов' })
  readonly login: string;

  @ApiProperty({
    example: 'passwordqqwerty123',
    description: 'Пароль пользователя',
  })
  @IsString({ message: 'Должен быть строкой' })
  @Length(6, 30, { message: 'Не меньше 6 и не больше 30 символов' })
  readonly password: string;
}
