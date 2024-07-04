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
import { AuthModule } from 'src/auth/auth.module';
import { Buyer } from 'src/buyer/buyer.model';
import { PersonInCharge } from 'src/person-in-charge/person-in-charge.model';
import { BuyerModule } from 'src/buyer/buyer.module';
import { PersonInChargeModule } from 'src/person-in-charge/person-in-charge.module';

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
      Buyer,
      PersonInCharge,
    ]),
    WoodClassModule,
    WoodTypeModule,
    DimensionModule,
    WoodConditionModule,
    WarehouseModule,
    AuthModule,
    BuyerModule,
    PersonInChargeModule,
  ],
  exports: [WoodShipmentService],
})
export class WoodShipmentModule {}
