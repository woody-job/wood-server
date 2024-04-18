import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateDimensionDto {
  @ApiProperty({ example: '150', description: 'Ширина доски (мм)' })
  @IsNumber({}, { message: 'Должна быть числом' })
  readonly width: number;

  @ApiProperty({ example: '150', description: 'Толщина доски (мм)' })
  @IsNumber({}, { message: 'Должна быть числом' })
  readonly thickness: number;

  @ApiProperty({ example: '6', description: 'Длина доски (м)' })
  @IsNumber({}, { message: 'Должна быть числом' })
  readonly length: number;

  @ApiProperty({ example: '5', description: 'id сорта доски' })
  @IsNotEmpty({ message: 'Не должен быть пустой' })
  @IsNumber({}, { message: 'Сорт выбран некорректно' })
  readonly woodClassId: number;
}
