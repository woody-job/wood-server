import { Module } from '@nestjs/common';
import { WorkshopWoodPricesService } from './workshop-wood-prices.service';
import { WorkshopWoodPricesController } from './workshop-wood-prices.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { WorkshopWoodPrice } from './workshop-wood-price.model';
import { Workshop } from 'src/workshop/workshop.model';
import { Dimension } from 'src/dimension/dimension.model';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodClassModule } from 'src/wood-class/wood-class.module';
import { DimensionModule } from 'src/dimension/dimension.module';
import { WorkshopModule } from 'src/workshop/workshop.module';
import { WorkshopOut } from 'src/workshop-out/workshop-out.model';

@Module({
  providers: [WorkshopWoodPricesService],
  controllers: [WorkshopWoodPricesController],
  imports: [
    SequelizeModule.forFeature([
      WorkshopWoodPrice,
      Workshop,
      Dimension,
      WoodClass,
      WorkshopOut,
    ]),
    WoodClassModule,
    DimensionModule,
    WorkshopModule,
  ],
  exports: [WorkshopWoodPricesService],
})
export class WorkshopWoodPricesModule {}
