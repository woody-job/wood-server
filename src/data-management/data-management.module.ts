import { Module } from '@nestjs/common';
import { DataManagementService } from './data-management.service';
import { DataManagementController } from './data-management.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Warehouse } from 'src/warehouse/warehouse.model';
import { Role } from 'src/roles/roles.model';
import { User } from 'src/users/users.model';
import { WoodCondition } from 'src/wood-condition/wood-condition.model';
import { WoodType } from 'src/wood-type/wood-type.model';
import { WoodClass } from 'src/wood-class/wood-class.model';
import { BeamSize } from 'src/beam-size/beam-size.model';
import { Workshop } from 'src/workshop/workshop.model';
import { BeamIn } from 'src/beam-in/beam-in.model';
import { WorkshopOut } from 'src/workshop-out/workshop-out.model';
import { WoodArrival } from 'src/wood-arrival/wood-arrival.model';
import { WoodShipment } from 'src/wood-shipment/wood-shipment.model';
import { DryerChamber } from 'src/dryer-chamber/dryer-chamber.model';
import { DryerChamberData } from 'src/dryer-chamber-data/dryer-chamber-data.model';
import { WorkshopDailyData } from 'src/workshop-daily-data/workshop-daily-data.model';
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

@Module({
  providers: [DataManagementService],
  controllers: [DataManagementController],
  imports: [
    SequelizeModule.forFeature([
      // Неконфигурируемые сущности
      Role,
      WoodCondition,
      WoodType,
      WoodClass,
      BeamSize,
      Workshop,

      User,

      // Удаляемые данные, настраиваемые пользователем
      BeamIn,
      WorkshopOut,
      WoodArrival,
      WoodShipment,
      Warehouse,
      DryerChamber,
      DryerChamberData,
      WorkshopDailyData,
    ]),
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
  ],
})
export class DataManagementModule {}
