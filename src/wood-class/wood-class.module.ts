import { Module } from '@nestjs/common';
import { WoodClassService } from './wood-class.service';
import { WoodClassController } from './wood-class.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { WoodClass } from './wood-class.model';
import { Dimension } from 'src/dimension/dimension.model';
import { WorkshopWoodPrice } from 'src/workshop-wood-prices/workshop-wood-price.model';
import { DryerChamberData } from 'src/dryer-chamber-data/dryer-chamber-data.model';
import { WorkshopOut } from 'src/workshop-out/workshop-out.model';
import { WoodArrival } from 'src/wood-arrival/wood-arrival.model';
import { WoodShipment } from 'src/wood-shipment/wood-shipment.model';
import { Warehouse } from 'src/warehouse/warehouse.model';

@Module({
  providers: [WoodClassService],
  controllers: [WoodClassController],
  imports: [
    SequelizeModule.forFeature([
      WoodClass,
      Dimension,
      WorkshopWoodPrice,
      DryerChamberData,
      WorkshopOut,
      WoodArrival,
      WoodShipment,
      Warehouse,
    ]),
  ],
  exports: [WoodClassService],
})
export class WoodClassModule {}
