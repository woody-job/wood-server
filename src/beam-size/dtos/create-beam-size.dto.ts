import { ApiProperty } from '@nestjs/swagger';
import { IsDecimal, IsNumber } from 'class-validator';

export class CreateBeamSizeDto {
  @ApiProperty({
    example: '12',
    description: 'Диаметр бревна в сантиметрах',
  })
  @IsNumber({}, { message: 'Должен быть числом' })
  readonly diameter: number;

  // TODO: Понять как работать с числами с плавающей точкой
  // @IsDecimal(
  //   { decimal_digits: '3', force_decimal: true },
  //   { message: 'Должен быть числом c плавающей точкой' },
  // )
  @ApiProperty({
    example: '0.095',
    description: 'Объем бревна в м3',
  })
  readonly volume: number;

  @ApiProperty({
    example: '6',
    description: 'Длина бревна в м',
  })
  readonly length: number;
}
