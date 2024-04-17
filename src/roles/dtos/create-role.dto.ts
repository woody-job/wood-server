import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'SUPERADMIN',
    description: 'Название роли пользователя',
  })
  @IsString({ message: 'Должно быть строкой' })
  @IsNotEmpty({ message: 'Не должно быть пустым' })
  @Length(4, 12, { message: 'Не меньше 4 и не больше 12 символов' })
  readonly name: string;

  @ApiProperty({
    example: 'SUPERADMIN',
    description: 'Описание роли пользователя',
  })
  @IsString({ message: 'Должно быть строкой' })
  @IsNotEmpty({ message: 'Не должно быть пустым' })
  readonly description: string;
}
