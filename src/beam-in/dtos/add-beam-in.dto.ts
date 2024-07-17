import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber } from 'class-validator';

export class AddBeamInDto {
  @ApiProperty({
    example: '1',
    description: 'id цеха',
  })
  @IsNumber({}, { message: 'Цех выбран некорректно' })
  readonly workshopId: number;

  @ApiProperty({
    example: '1',
    description: 'id размера леса',
  })
  @IsNumber({}, { message: 'Размер выбран некорректно' })
  readonly beamSizeId: number;

  @ApiProperty({
    example: '1',
    description: 'id условного обозначения',
  })
  @IsNumber({}, { message: 'Условное обозначение выбрано некорректно' })
  readonly woodNamingId: number;

  @ApiProperty({
    example: '12',
    description: 'Количество',
  })
  @IsNotEmpty({ message: 'Не должно быть пустой' })
  @IsNumber({}, { message: 'Должно быть числом' })
  readonly amount: number;

  @ApiProperty({
    example: '2024-04-21T12:00:00.000Z',
    description: 'Дата в формате ISO 8601',
  })
  @IsDateString({}, { message: 'Дата имеет некорректный формат (не ISO8601)' })
  readonly date: string;
}
