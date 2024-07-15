import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateBeamArrivalDto {
  @ApiProperty({
    example: '12',
    description: 'Количество',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Должно быть числом' })
  readonly amount: number;

  @ApiProperty({
    example: '1',
    description: 'Объем в м3',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Объем выбран некорректно' })
  readonly volume: number;
}
