import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber } from 'class-validator';

export class CreateWarehouseRecordDto {
  @ApiProperty({
    example: '12',
    description: 'Количество',
  })
  @IsNumber({}, { message: 'Должно быть числом' })
  readonly amount: number;

  @ApiProperty({
    example: '1',
    description: 'id состояния дерева',
  })
  @IsNumber({}, { message: 'Состояние дерева выбрано некорректно' })
  readonly woodConditionId: number;

  @ApiProperty({
    example: '1',
    description: 'id сорта',
  })
  @IsNumber({}, { message: 'Сорт выбран некорректно' })
  readonly woodClassId: number;

  @ApiProperty({
    example: '1',
    description: 'id породы',
  })
  @IsNumber({}, { message: 'Порода выбрана некорректно' })
  readonly woodTypeId: number;

  @ApiProperty({
    example: '1',
    description: 'id сечения',
  })
  @IsNumber({}, { message: 'Сечение выбрано некорректно' })
  readonly dimensionId: number;
}
