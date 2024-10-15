import { IsDateString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateDryerChamberDataDto {
  @IsNumber()
  readonly woodClassId: number;

  @IsNumber()
  readonly dimensionId: number;

  @IsNumber()
  readonly woodTypeId: number;

  @IsDateString({}, { message: 'Дата имеет некорректный формат (не ISO8601)' })
  readonly date: string;

  @IsNumber()
  @IsNotEmpty()
  readonly amount: number;

  @IsNumber()
  @IsNotEmpty()
  readonly chamberIterationCount: number;
}
