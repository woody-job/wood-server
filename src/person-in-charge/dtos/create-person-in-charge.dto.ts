import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreatePersonInChargeDto {
  @ApiProperty({
    example: 'М.П',
    description: 'Инициалы',
  })
  @IsString()
  @Length(1, 10, { message: 'Не меньше 1 и не больше 10 символов' })
  readonly initials: string;

  @ApiProperty({
    example: 'Зубенко',
    description: 'Фамилия',
  })
  @IsString()
  @Length(1, 30, { message: 'Не меньше 1 и не больше 30 символов' })
  readonly secondName: string;
}
