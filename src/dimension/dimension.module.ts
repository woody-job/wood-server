import { Module } from '@nestjs/common';
import { DimensionService } from './dimension.service';
import { DimensionController } from './dimension.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Dimension } from './dimension.model';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { WoodClassModule } from 'src/wood-class/wood-class.module';

@Module({
  providers: [DimensionService],
  controllers: [DimensionController],
  imports: [
    SequelizeModule.forFeature([Dimension, WoodClass]),
    WoodClassModule,
  ],
})
export class DimensionModule {}
