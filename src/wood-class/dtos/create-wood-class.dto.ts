import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateWoodClassDto {
  @ApiProperty({
    example: 'Рыночный',
    description: 'Название сорта',
  })
  @IsString()
  @Length(2, 20, { message: 'Не меньше 2 и не больше 20 символов' })
  readonly name: string;
}
