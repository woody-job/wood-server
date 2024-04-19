import { Module } from '@nestjs/common';
import { WorkshopController } from './workshop.controller';
import { WorkshopService } from './workshop.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Workshop } from './workshop.model';
import { WorkshopWoodPrice } from 'src/workshop-wood-prices/workshop-wood-price.model';

@Module({
  controllers: [WorkshopController],
  providers: [WorkshopService],
  imports: [SequelizeModule.forFeature([Workshop, WorkshopWoodPrice])],
  exports: [WorkshopService],
})
export class WorkshopModule {}
