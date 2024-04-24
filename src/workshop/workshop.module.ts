import { Module } from '@nestjs/common';
import { WorkshopController } from './workshop.controller';
import { WorkshopService } from './workshop.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Workshop } from './workshop.model';
import { WorkshopWoodPrice } from 'src/workshop-wood-prices/workshop-wood-price.model';
import { BeamIn } from 'src/beam-in/beam-in.model';
import { WorkshopDailyData } from 'src/workshop-daily-data/workshop-daily-data.model';
import { WorkshopOut } from 'src/workshop-out/workshop-out.model';

@Module({
  controllers: [WorkshopController],
  providers: [WorkshopService],
  imports: [
    SequelizeModule.forFeature([
      Workshop,
      WorkshopWoodPrice,
      BeamIn,
      WorkshopDailyData,
      WorkshopOut,
    ]),
  ],
  exports: [WorkshopService],
})
export class WorkshopModule {}
