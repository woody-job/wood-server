import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateDryerChamberDto {
  @ApiProperty({
    example: 'Сушилка 1',
    description: 'Название сушильной камеры',
  })
  @IsString({ message: 'Должно быть строкой' })
  @Length(2, 25, { message: 'Не меньше 2 и не больше 25 символов' })
  readonly name: string;
}
