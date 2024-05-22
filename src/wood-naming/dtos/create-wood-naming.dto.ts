import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateWoodNamingDto {
  @ApiProperty({
    example: 'Елка 6',
    description: 'Название условного обозначения',
  })
  @IsString()
  @Length(2, 40, { message: 'Не меньше 2 и не больше 40 символов' })
  readonly name: string;
}
