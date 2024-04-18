import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateWoodConditionDto {
  @ApiProperty({
    example: 'Сухая',
    description: 'Название состояния',
  })
  @IsString()
  @Length(2, 20, { message: 'Не меньше 2 и не больше 20 символов' })
  readonly name: string;
}
