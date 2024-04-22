import { Module } from '@nestjs/common';
import { DimensionService } from './dimension.service';
import { DimensionController } from './dimension.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Dimension } from './dimension.model';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodClassModule } from 'src/wood-class/wood-class.module';
import { WorkshopWoodPrice } from 'src/workshop-wood-prices/workshop-wood-price.model';
import { DryerChamberData } from 'src/dryer-chamber-data/dryer-chamber-data.model';

@Module({
  providers: [DimensionService],
  controllers: [DimensionController],
  imports: [
    SequelizeModule.forFeature([
      Dimension,
      WoodClass,
      WorkshopWoodPrice,
      DryerChamberData,
    ]),
    WoodClassModule,
  ],
  exports: [DimensionService],
})
export class DimensionModule {}
