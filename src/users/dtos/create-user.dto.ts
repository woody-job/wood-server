import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Должен быть строкой' })
  @Length(4, 16, { message: 'Не меньше 4 и не больше 16 символов' })
  readonly login: string;

  @IsString({ message: 'Должно быть строкой' })
  @Length(6, 30, { message: 'Не меньше 6 и не больше 30 символов' })
  readonly fullName: string;

  @IsString({ message: 'Должен быть строкой' })
  @Length(15, 30, { message: 'Не меньше 6 и не больше 30 символов' })
  readonly password: string;

  @IsNotEmpty({ message: 'Не должна быть пустой' })
  readonly roleId: number;
}
