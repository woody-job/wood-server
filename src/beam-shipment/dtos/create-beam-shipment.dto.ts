import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional } from 'class-validator';

export class CreateBeamShipmentDto {
  @ApiProperty({
    example: '2024-04-21T12:00:00.000Z',
    description: 'Дата в формате ISO 8601',
  })
  @IsDateString({}, { message: 'Дата имеет некорректный формат (не ISO8601)' })
  readonly date: string;

  @ApiProperty({
    example: '1',
    description: 'id покупателя',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Покупатель выбран некорректно' })
  readonly buyerId: number;

  @ApiProperty({
    example: '1',
    description: 'id породы',
  })
  @IsNumber({}, { message: 'Порода выбрана некорректно' })
  readonly woodTypeId: number;

  @ApiProperty({
    example: '6',
    description: 'Длина бревна, м',
  })
  @IsNumber({}, { message: 'Длина введена некорректно' })
  length: number;

  @ApiProperty({
    example: '12',
    description: 'Количество',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Должно быть числом' })
  readonly amount: number;

  @ApiProperty({
    example: '1',
    description: 'id размера леса',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Диаметр выбран некорректно' })
  readonly beamSizeId: number;

  @ApiProperty({
    example: '1',
    description: 'Объем в м3',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Объем выбран некорректно' })
  readonly volume: number;
}
