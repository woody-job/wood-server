import { Module } from '@nestjs/common';
import { WoodConditionController } from './wood-condition.controller';
import { WoodConditionService } from './wood-condition.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { WoodCondition } from './wood-condition.model';
import { WoodArrival } from 'src/wood-arrival/wood-arrival.model';
import { WoodShipment } from 'src/wood-shipment/wood-shipment.model';
import { Warehouse } from 'src/warehouse/warehouse.model';

@Module({
  controllers: [WoodConditionController],
  providers: [WoodConditionService],
  imports: [
    SequelizeModule.forFeature([
      WoodCondition,
      WoodArrival,
      WoodShipment,
      Warehouse,
    ]),
  ],
  exports: [WoodConditionService],
})
export class WoodConditionModule {}
