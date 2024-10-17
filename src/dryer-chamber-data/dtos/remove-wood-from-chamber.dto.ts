import { IsNotEmpty, IsNumber } from 'class-validator';

export class RemoveWoodFromChamberDto {
  @IsNumber()
  readonly dryerChamberDataRecordId: number;

  @IsNumber()
  readonly woodClassId: number;

  @IsNumber()
  @IsNotEmpty()
  readonly amount: number;
}
