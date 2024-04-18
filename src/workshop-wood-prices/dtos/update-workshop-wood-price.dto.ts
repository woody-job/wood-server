import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UpdateWorkshopWoodPriceDto {
  @ApiProperty({ example: '15000', description: 'Ширина 1м3 доски для цеха' })
  @IsNumber({}, { message: 'Должна быть числом' })
  readonly price: number;
}
