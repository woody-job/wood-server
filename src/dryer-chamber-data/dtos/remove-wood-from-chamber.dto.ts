import { IsNumber, IsOptional } from 'class-validator';
import { CreateDryerChamberDataDto } from './create-dryer-chamber-data.dto';

export class RemoveWoodFromChamberDto extends CreateDryerChamberDataDto {
  @IsNumber()
  @IsOptional()
  readonly dryerChamberDataRecordId: number;
}
