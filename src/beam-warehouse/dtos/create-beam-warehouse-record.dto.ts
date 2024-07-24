import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateBeamWarehouseRecordDto {
  @ApiProperty({
    example: '1',
    description: 'id условного обозначения леса',
  })
  @IsNumber({}, { message: 'Условное обозначение выбрано некорректно' })
  readonly woodNamingId: number;

  @ApiProperty({
    example: '1',
    description: 'Объем',
  })
  @IsNumber({}, { message: 'Объем выбран некорректно' })
  readonly volume: number;
}
