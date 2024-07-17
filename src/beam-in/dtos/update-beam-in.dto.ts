import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateBeamInDto {
  @ApiProperty({
    example: '12',
    description: 'Количество',
  })
  @IsNotEmpty({ message: 'Не должно быть пустой' })
  @IsNumber({}, { message: 'Должно быть числом' })
  readonly amount: number;
}
