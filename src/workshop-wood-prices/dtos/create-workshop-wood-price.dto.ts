import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateWorkshopWoodPriceDto {
  @ApiProperty({ example: '15000', description: 'Ширина 1м3 доски для цеха' })
  @IsNumber({}, { message: 'Должна быть числом' })
  readonly price: number;

  @ApiProperty({ example: '8', description: 'id цеха' })
  @IsNotEmpty({ message: 'Не должен быть пустым' })
  @IsNumber({}, { message: 'Цех выбран некорректно' })
  readonly workshopId: number;

  @ApiProperty({ example: '12', description: 'id сечения' })
  @IsNotEmpty({ message: 'Не должно быть пустым' })
  @IsNumber({}, { message: 'Сечение выбрано некорректно' })
  readonly dimensionId: number;

  @ApiProperty({ example: '122', description: 'id сорта' })
  @IsNotEmpty({ message: 'Не должен быть пустой' })
  @IsNumber({}, { message: 'Сорт выбран некорректно' })
  readonly woodClassId: number;
}
