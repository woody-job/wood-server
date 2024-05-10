import { Module } from '@nestjs/common';
import { WoodShipmentService } from './wood-shipment.service';
import { WoodShipmentController } from './wood-shipment.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Dimension } from 'src/dimension/dimension.model';
import { DimensionModule } from 'src/dimension/dimension.module';
import { WoodShipment } from './wood-shipment.model';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodClassModule } from 'src/wood-class/wood-class.module';
import { WoodCondition } from 'src/wood-condition/wood-condition.model';
import { WoodConditionModule } from 'src/wood-condition/wood-condition.module';
import { WoodType } from 'src/wood-type/wood-type.model';
import { WoodTypeModule } from 'src/wood-type/wood-type.module';
import { WarehouseModule } from 'src/warehouse/warehouse.module';

@Module({
  providers: [WoodShipmentService],
  controllers: [WoodShipmentController],
  imports: [
    SequelizeModule.forFeature([
      WoodShipment,
      WoodClass,
      WoodType,
      Dimension,
      WoodCondition,
    ]),
    WoodClassModule,
    WoodTypeModule,
    DimensionModule,
    WoodConditionModule,
    WarehouseModule,
  ],
})
export class WoodShipmentModule {}
