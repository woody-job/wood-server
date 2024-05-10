import { Module, forwardRef } from '@nestjs/common';
import { WoodArrivalService } from './wood-arrival.service';
import { WoodArrivalController } from './wood-arrival.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { WoodArrival } from './wood-arrival.model';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodType } from 'src/wood-type/wood-type.model';
import { Dimension } from 'src/dimension/dimension.model';
import { WoodCondition } from 'src/wood-condition/wood-condition.model';
import { WoodClassModule } from 'src/wood-class/wood-class.module';
import { WoodTypeModule } from 'src/wood-type/wood-type.module';
import { DimensionModule } from 'src/dimension/dimension.module';
import { WoodConditionModule } from 'src/wood-condition/wood-condition.module';
import { WarehouseModule } from 'src/warehouse/warehouse.module';
import { WorkshopOut } from 'src/workshop-out/workshop-out.model';
import { WorkshopOutModule } from 'src/workshop-out/workshop-out.module';

@Module({
  providers: [WoodArrivalService],
  controllers: [WoodArrivalController],
  imports: [
    SequelizeModule.forFeature([
      WoodArrival,
      WoodClass,
      WoodType,
      Dimension,
      WoodCondition,
    ]),
    WoodClassModule,
    WoodTypeModule,
    DimensionModule,
    WoodConditionModule,
  ],
  exports: [WoodArrivalService],
})
export class WoodArrivalModule {}
