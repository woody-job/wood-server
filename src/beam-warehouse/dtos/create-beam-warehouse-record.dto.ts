import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class CreateBeamWarehouseRecordDto {
  @ApiProperty({
    example: '1',
    description: 'id условного обозначения леса',
  })
  @IsNumber({}, { message: 'Условное обозначение выбрано некорректно' })
  readonly woodNamingId: number;

  @ApiProperty({
    example: '1',
    description: 'id размера леса',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Размер леса (диаметр) выбран некорректно' })
  readonly beamSizeId?: number;

  @ApiProperty({
    example: '12',
    description: 'Количество',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Количество выбрано некорректно' })
  readonly amount?: number;

  @ApiProperty({
    example: '1',
    description: 'Объем',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Объем выбран некорректно' })
  readonly volume?: number;
}
