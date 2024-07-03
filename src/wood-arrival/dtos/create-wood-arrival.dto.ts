import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateWoodArrivalDto {
  @ApiProperty({
    example: '2024-04-21T12:00:00.000Z',
    description: 'Дата в формате ISO 8601',
  })
  @IsDateString({}, { message: 'Дата имеет некорректный формат (не ISO8601)' })
  readonly date: string;

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

  @ApiProperty({
    example: '1',
    description: 'id поставщика',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Поставщик выбран некорректно' })
  readonly supplierId: number;

  @ApiProperty({
    example: 'мерс 2881337/1612',
    description: 'Марка и номера машины (одна строка)',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50, { message: 'Не меньше 1 и не больше 50 символов' })
  readonly car: string;
}
