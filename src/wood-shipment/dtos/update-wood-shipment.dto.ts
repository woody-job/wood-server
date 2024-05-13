import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UpdateWoodShipmentDto {
  @ApiProperty({
    example: '12',
    description: 'Количество',
  })
  @IsNumber({}, { message: 'Должно быть числом' })
  readonly amount: number;

  @ApiProperty({
    example: '1',
    description: 'id сорта',
  })
  @IsNumber({}, { message: 'Сорт выбран некорректно' })
  readonly woodClassId: number;

  @ApiProperty({
    example: '1',
    description: 'id сечения',
  })
  @IsNumber({}, { message: 'Сечение выбрано некорректно' })
  readonly dimensionId: number;
}
