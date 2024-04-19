import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Length } from 'class-validator';

export class CreateWorkshopDto {
  @ApiProperty({ example: 'Цех 1', description: 'Название цеха' })
  @IsString()
  @Length(4, 30, { message: 'Не меньше 4 и не больше 30 символов' })
  readonly name: string;

  @ApiProperty({ example: '5800', description: 'Цена сырья (рубли)' })
  @IsNumber({}, { message: 'Должна быть числом' })
  readonly priceOfRawMaterials: number;

  @ApiProperty({ example: '3000', description: 'Цена распиловки (рубли)' })
  @IsNumber({}, { message: 'Должна быть числом' })
  readonly sawingPrice: number;
}
