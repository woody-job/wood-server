import { Module, forwardRef } from '@nestjs/common';
import { WorkshopOutController } from './workshop-out.controller';
import { WorkshopOutService } from './workshop-out.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { WorkshopOut } from './workshop-out.model';
import { WorkshopWoodPrice } from 'src/workshop-wood-prices/workshop-wood-price.model';
import { Workshop } from 'src/workshop/workshop.model';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodType } from 'src/wood-type/wood-type.model';
import { Dimension } from 'src/dimension/dimension.model';
import { WorkshopWoodPricesModule } from 'src/workshop-wood-prices/workshop-wood-prices.module';
import { WorkshopModule } from 'src/workshop/workshop.module';
import { WoodClassModule } from 'src/wood-class/wood-class.module';
import { WoodTypeModule } from 'src/wood-type/wood-type.module';
import { DimensionModule } from 'src/dimension/dimension.module';
import { WoodConditionModule } from 'src/wood-condition/wood-condition.module';
import { WoodArrivalModule } from 'src/wood-arrival/wood-arrival.module';
import { WarehouseModule } from 'src/warehouse/warehouse.module';
import { BeamInModule } from 'src/beam-in/beam-in.module';
import { WorkshopDailyDataModule } from 'src/workshop-daily-data/workshop-daily-data.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [WorkshopOutController],
  providers: [WorkshopOutService],
  imports: [
    SequelizeModule.forFeature([
      WorkshopOut,
      WorkshopWoodPrice,
      Workshop,
      WoodClass,
      WoodType,
      Dimension,
    ]),
    WorkshopWoodPricesModule,
    WorkshopModule,
    WoodClassModule,
    WoodTypeModule,
    WoodConditionModule,
    DimensionModule,
    WoodArrivalModule,
    WarehouseModule,
    forwardRef(() => BeamInModule),
    forwardRef(() => WorkshopDailyDataModule),
    AuthModule,
  ],
  exports: [WorkshopOutService],
})
export class WorkshopOutModule {}
