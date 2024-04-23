import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class UpdateBeamInDto {
  @ApiProperty({
    example: '1',
    description: 'id размера леса',
  })
  @IsNumber({}, { message: 'Размер выбран некорректно' })
  readonly beamSizeId: number;

  @ApiProperty({
    example: '12',
    description: 'Количество',
  })
  @IsNotEmpty({ message: 'Не должно быть пустой' })
  @IsNumber({}, { message: 'Должно быть числом' })
  readonly amount: number;
}
