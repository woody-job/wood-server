import { Module } from '@nestjs/common';
import { WoodTypeController } from './wood-type.controller';
import { WoodTypeService } from './wood-type.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { WoodType } from './wood-type.model';
import { DryerChamberData } from 'src/dryer-chamber-data/dryer-chamber-data.model';
import { WorkshopOut } from 'src/workshop-out/workshop-out.model';

@Module({
  controllers: [WoodTypeController],
  providers: [WoodTypeService],
  imports: [
    SequelizeModule.forFeature([WoodType, DryerChamberData, WorkshopOut]),
  ],
  exports: [WoodTypeService],
})
export class WoodTypeModule {}
