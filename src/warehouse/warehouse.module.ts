import { Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Dimension } from 'src/dimension/dimension.model';
import { DimensionModule } from 'src/dimension/dimension.module';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodClassModule } from 'src/wood-class/wood-class.module';
import { WoodCondition } from 'src/wood-condition/wood-condition.model';
import { WoodConditionModule } from 'src/wood-condition/wood-condition.module';
import { WoodType } from 'src/wood-type/wood-type.model';
import { WoodTypeModule } from 'src/wood-type/wood-type.module';
import { Warehouse } from './warehouse.model';

@Module({
  providers: [WarehouseService],
  controllers: [WarehouseController],
  imports: [
    SequelizeModule.forFeature([
      Warehouse,
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
  exports: [WarehouseService],
})
export class WarehouseModule {}
