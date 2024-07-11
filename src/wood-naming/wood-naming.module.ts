import { Module } from '@nestjs/common';
import { WoodNamingController } from './wood-naming.controller';
import { WoodNamingService } from './wood-naming.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { WoodNaming } from './wood-naming.model';
import { WorkshopDailyData } from 'src/workshop-daily-data/workshop-daily-data.model';
import { AuthModule } from 'src/auth/auth.module';
import { WoodType } from 'src/wood-type/wood-type.model';
import { WoodTypeModule } from 'src/wood-type/wood-type.module';

@Module({
  controllers: [WoodNamingController],
  providers: [WoodNamingService],
  imports: [
    SequelizeModule.forFeature([WoodNaming, WorkshopDailyData, WoodType]),
    AuthModule,
    WoodTypeModule,
  ],
  exports: [WoodNamingService],
})
export class WoodNamingModule {}
