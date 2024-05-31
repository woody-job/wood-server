import { Module } from '@nestjs/common';
import { WoodTypeController } from './wood-type.controller';
import { WoodTypeService } from './wood-type.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { WoodType } from './wood-type.model';
import { DryerChamberData } from 'src/dryer-chamber-data/dryer-chamber-data.model';
import { WorkshopOut } from 'src/workshop-out/workshop-out.model';
import { WoodArrival } from 'src/wood-arrival/wood-arrival.model';
import { WoodShipment } from 'src/wood-shipment/wood-shipment.model';
import { Warehouse } from 'src/warehouse/warehouse.model';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [WoodTypeController],
  providers: [WoodTypeService],
  imports: [
    SequelizeModule.forFeature([
      WoodType,
      DryerChamberData,
      WorkshopOut,
      WoodArrival,
      WoodShipment,
      Warehouse,
    ]),
    AuthModule,
  ],
  exports: [WoodTypeService],
})
export class WoodTypeModule {}
