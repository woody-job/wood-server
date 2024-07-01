import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateBuyerDto {
  @ApiProperty({
    example: 'Покупатель 1',
    description: 'Наименование покупателя',
  })
  @IsString()
  @Length(1, 50, { message: 'Не меньше 1 и не больше 50 символов' })
  readonly name: string;
}
