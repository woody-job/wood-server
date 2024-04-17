import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'zubabuba11', description: 'Логин пользователя' })
  @IsString({ message: 'Должен быть строкой' })
  @Length(4, 16, { message: 'Не меньше 4 и не больше 16 символов' })
  readonly login: string;

  @ApiProperty({
    example: 'Зубенко Михаил Петрович',
    description: 'ФИО пользователя',
  })
  @IsString({ message: 'Должно быть строкой' })
  @Length(6, 30, { message: 'Не меньше 6 и не больше 30 символов' })
  readonly fullName: string;

  @ApiProperty({
    example: 'passwordqqwerty123',
    description: 'Пароль пользователя',
  })
  @IsString({ message: 'Должен быть строкой' })
  @Length(6, 30, { message: 'Не меньше 6 и не больше 30 символов' })
  readonly password: string;

  @ApiProperty({ example: '3', description: 'id роли для пользователя' })
  @IsNotEmpty({ message: 'Не должна быть пустой' })
  @IsNumber({}, { message: 'Роль выбрана некорректно' })
  readonly roleId: number;
}
