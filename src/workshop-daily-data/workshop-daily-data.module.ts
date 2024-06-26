import { Module, forwardRef } from '@nestjs/common';
import { WorkshopDailyDataService } from './workshop-daily-data.service';
import { WorkshopDailyDataController } from './workshop-daily-data.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { WorkshopDailyData } from './workshop-daily-data.model';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';
import { Workshop } from 'src/workshop/workshop.model';
import { WoodNamingModule } from 'src/wood-naming/wood-naming.module';
import { WorkshopModule } from 'src/workshop/workshop.module';
import { DimensionModule } from 'src/dimension/dimension.module';
import { WorkshopOutModule } from 'src/workshop-out/workshop-out.module';
import { BeamInModule } from 'src/beam-in/beam-in.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [WorkshopDailyDataService],
  controllers: [WorkshopDailyDataController],
  imports: [
    SequelizeModule.forFeature([WorkshopDailyData, WoodNaming, Workshop]),
    WoodNamingModule,
    WorkshopModule,
    DimensionModule,
    forwardRef(() => WorkshopOutModule),
    forwardRef(() => BeamInModule),
    AuthModule,
  ],
  exports: [WorkshopDailyDataService],
})
export class WorkshopDailyDataModule {}
