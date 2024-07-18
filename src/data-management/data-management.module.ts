import { Module } from '@nestjs/common';
import { DataManagementService } from './data-management.service';
import { DataManagementController } from './data-management.controller';
import { RolesModule } from 'src/roles/roles.module';
import { BeamInModule } from 'src/beam-in/beam-in.module';
import { BeamSizeModule } from 'src/beam-size/beam-size.module';
import { DryerChamberDataModule } from 'src/dryer-chamber-data/dryer-chamber-data.module';
import { DryerChamberModule } from 'src/dryer-chamber/dryer-chamber.module';
import { WarehouseModule } from 'src/warehouse/warehouse.module';
import { WoodArrivalModule } from 'src/wood-arrival/wood-arrival.module';
import { WoodClassModule } from 'src/wood-class/wood-class.module';
import { WoodConditionModule } from 'src/wood-condition/wood-condition.module';
import { WoodShipmentModule } from 'src/wood-shipment/wood-shipment.module';
import { WoodTypeModule } from 'src/wood-type/wood-type.module';
import { WorkshopDailyDataModule } from 'src/workshop-daily-data/workshop-daily-data.module';
import { WorkshopOutModule } from 'src/workshop-out/workshop-out.module';
import { WorkshopModule } from 'src/workshop/workshop.module';
import { AuthModule } from 'src/auth/auth.module';
import { BeamArrivalModule } from 'src/beam-arrival/beam-arrival.module';
import { BeamShipmentModule } from 'src/beam-shipment/beam-shipment.module';
import { BeamWarehouseModule } from 'src/beam-warehouse/beam-warehouse.module';

@Module({
  providers: [DataManagementService],
  controllers: [DataManagementController],
  imports: [
    RolesModule,
    WoodConditionModule,
    WoodTypeModule,
    WoodClassModule,
    BeamSizeModule,
    WorkshopModule,
    AuthModule,
    BeamInModule,
    WorkshopOutModule,
    WoodArrivalModule,
    WoodShipmentModule,
    WarehouseModule,
    DryerChamberModule,
    DryerChamberDataModule,
    WorkshopDailyDataModule,

    BeamArrivalModule,
    BeamShipmentModule,
    BeamWarehouseModule,
  ],
})
export class DataManagementModule {}
