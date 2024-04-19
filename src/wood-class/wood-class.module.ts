import { Module } from '@nestjs/common';
import { WoodClassService } from './wood-class.service';
import { WoodClassController } from './wood-class.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { WoodClass } from './wood-class.model';
import { Dimension } from 'src/dimension/dimension.model';
import { WorkshopWoodPrice } from 'src/workshop-wood-prices/workshop-wood-price.model';

@Module({
  providers: [WoodClassService],
  controllers: [WoodClassController],
  imports: [
    SequelizeModule.forFeature([WoodClass, Dimension, WorkshopWoodPrice]),
  ],
  exports: [WoodClassService],
})
export class WoodClassModule {}
