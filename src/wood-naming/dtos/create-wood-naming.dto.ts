import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class CreateWoodNamingDto {
  @ApiProperty({
    example: 'Елка 6',
    description: 'Название условного обозначения',
  })
  @IsString()
  @Length(2, 40, { message: 'Не меньше 2 и не больше 40 символов' })
  readonly name: string;

  @ApiProperty({
    example: '1',
    description: 'id породы леса',
  })
  woodTypeId: number;

  @ApiProperty({
    example: '10',
    description: 'Минимальный диаметр бревна, см',
  })
  @IsOptional()
  @IsNumber()
  minDiameter: number;

  @ApiProperty({
    example: '16',
    description: 'Максимальный диаметр бревна, см',
  })
  @IsOptional()
  @IsNumber()
  maxDiameter: number;

  @ApiProperty({
    example: '6',
    description: 'Длина бревна, м',
  })
  @IsNumber()
  length: number;
}
