import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber } from 'class-validator';

export class CreateWorkshopDailyDataDto {
  @ApiProperty({
    example: '2024-04-21T12:00:00.000Z',
    description: 'Дата в формате ISO 8601',
  })
  @IsDateString({}, { message: 'Дата имеет некорректный формат (не ISO8601)' })
  readonly date: string;

  @ApiProperty({
    example: '1',
    description: 'id цеха',
  })
  @IsNumber({}, { message: 'Цех выбран некорректно' })
  readonly workshopId: number;

  @ApiProperty({
    example: '1',
    description: 'id сечения',
  })
  @IsNumber({}, { message: 'Сечение выбрано некорректно' })
  readonly dimensionId: number;

  @ApiProperty({
    example: '1',
    description: 'id условного обозначения',
  })
  @IsNumber({}, { message: 'Условное обозначение выбрано некорректно' })
  readonly woodNamingId: number;
}
