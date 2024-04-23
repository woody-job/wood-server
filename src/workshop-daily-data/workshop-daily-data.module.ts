import { Module } from '@nestjs/common';
import { WorkshopDailyDataService } from './workshop-daily-data.service';
import { WorkshopDailyDataController } from './workshop-daily-data.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { WorkshopDailyData } from './workshop-daily-data.model';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';
import { Workshop } from 'src/workshop/workshop.model';
import { WoodNamingModule } from 'src/wood-naming/wood-naming.module';
import { WorkshopModule } from 'src/workshop/workshop.module';
import { DimensionModule } from 'src/dimension/dimension.module';

@Module({
  providers: [WorkshopDailyDataService],
  controllers: [WorkshopDailyDataController],
  imports: [
    SequelizeModule.forFeature([WorkshopDailyData, WoodNaming, Workshop]),
    WoodNamingModule,
    WorkshopModule,
    DimensionModule,
  ],
})
export class WorkshopDailyDataModule {}
