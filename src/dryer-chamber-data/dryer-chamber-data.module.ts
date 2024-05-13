import { Module } from '@nestjs/common';
import { DryerChamberDataController } from './dryer-chamber-data.controller';
import { DryerChamberDataService } from './dryer-chamber-data.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { DryerChamberData } from './dryer-chamber-data.model';
import { DryerChamber } from 'src/dryer-chamber/dryer-chamber.model';
import { Dimension } from 'src/dimension/dimension.model';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodClassModule } from 'src/wood-class/wood-class.module';
import { DimensionModule } from 'src/dimension/dimension.module';
import { DryerChamberModule } from 'src/dryer-chamber/dryer-chamber.module';
import { WoodType } from 'src/wood-type/wood-type.model';
import { WoodTypeModule } from 'src/wood-type/wood-type.module';
import { WoodArrivalModule } from 'src/wood-arrival/wood-arrival.module';
import { WoodConditionModule } from 'src/wood-condition/wood-condition.module';
import { WarehouseModule } from 'src/warehouse/warehouse.module';
import { WoodShipmentModule } from 'src/wood-shipment/wood-shipment.module';

@Module({
  controllers: [DryerChamberDataController],
  providers: [DryerChamberDataService],
  imports: [
    SequelizeModule.forFeature([
      DryerChamberData,
      DryerChamber,
      Dimension,
      WoodClass,
      WoodType,
    ]),
    WoodClassModule,
    DimensionModule,
    DryerChamberModule,
    WoodTypeModule,
    WoodArrivalModule,
    WoodConditionModule,
    WarehouseModule,
    WoodShipmentModule,
  ],
})
export class DryerChamberDataModule {}
