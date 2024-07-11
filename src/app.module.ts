import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { RolesModule } from './roles/roles.module';
import { User } from './users/users.model';
import { Role } from './roles/roles.model';
import { AuthModule } from './auth/auth.module';
import { WoodConditionModule } from './wood-condition/wood-condition.module';
import { WoodTypeModule } from './wood-type/wood-type.module';
import { WoodClassModule } from './wood-class/wood-class.module';
import { DimensionModule } from './dimension/dimension.module';
import { WoodNamingModule } from './wood-naming/wood-naming.module';
import { WorkshopModule } from './workshop/workshop.module';
import { WorkshopWoodPricesModule } from './workshop-wood-prices/workshop-wood-prices.module';
import { WoodClass } from './wood-class/wood-class.model';
import { WoodType } from './wood-type/wood-type.model';
import { WoodCondition } from './wood-condition/wood-condition.model';
import { Dimension } from './dimension/dimension.model';
import { WoodNaming } from './wood-naming/wood-naming.model';
import { Workshop } from './workshop/workshop.model';
import { WorkshopWoodPrice } from './workshop-wood-prices/workshop-wood-price.model';
import { BeamInModule } from './beam-in/beam-in.module';
import { BeamIn } from './beam-in/beam-in.model';
import { BeamSizeModule } from './beam-size/beam-size.module';
import { BeamSize } from './beam-size/beam-size.model';
import { DryerChamberModule } from './dryer-chamber/dryer-chamber.module';
import { DryerChamber } from './dryer-chamber/dryer-chamber.model';
import { DryerChamberDataModule } from './dryer-chamber-data/dryer-chamber-data.module';
import { DryerChamberData } from './dryer-chamber-data/dryer-chamber-data.model';
import { WorkshopDailyDataModule } from './workshop-daily-data/workshop-daily-data.module';
import { WorkshopDailyData } from './workshop-daily-data/workshop-daily-data.model';
import { WorkshopOutModule } from './workshop-out/workshop-out.module';
import { WorkshopOut } from './workshop-out/workshop-out.model';
import { WoodArrivalModule } from './wood-arrival/wood-arrival.module';
import { WoodShipmentModule } from './wood-shipment/wood-shipment.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { WoodArrival } from './wood-arrival/wood-arrival.model';
import { WoodShipment } from './wood-shipment/wood-shipment.model';
import { Warehouse } from './warehouse/warehouse.model';
import { DataManagementController } from './data-management/data-management.controller';
import { DataManagementService } from './data-management/data-management.service';
import { DataManagementModule } from './data-management/data-management.module';
import { SupplierModule } from './supplier/supplier.module';
import { Supplier } from './supplier/supplier.model';
import { BuyerModule } from './buyer/buyer.module';
import { Buyer } from './buyer/buyer.model';
import { PersonInChargeModule } from './person-in-charge/person-in-charge.module';
import { PersonInCharge } from './person-in-charge/person-in-charge.model';

@Module({
  controllers: [DataManagementController],
  providers: [DataManagementService],
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
    }),
    SequelizeModule.forRoot({
      name: 'default',
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'development' ? false : true,
      },
      pool: {
        max: 10000,
        min: 0,
        acquire: 30 * 1000,
        idle: 10 * 1000,
      },
      models: [
        User,
        Role,
        WoodClass,
        WoodType,
        WoodCondition,
        WoodNaming,
        Dimension,
        Workshop,
        WorkshopWoodPrice,
        BeamIn,
        BeamSize,
        DryerChamber,
        DryerChamberData,
        WorkshopDailyData,
        WorkshopOut,
        WoodArrival,
        WoodShipment,
        Warehouse,
        Supplier,
        Buyer,
        PersonInCharge,
      ],
      autoLoadModels: true,
      synchronize: true,
    }),
    UsersModule,
    RolesModule,
    AuthModule,
    WoodConditionModule,
    WoodTypeModule,
    WoodClassModule,
    DimensionModule,
    WoodNamingModule,
    WorkshopModule,
    WorkshopWoodPricesModule,
    BeamInModule,
    BeamSizeModule,
    DryerChamberModule,
    DryerChamberDataModule,
    WorkshopDailyDataModule,
    WorkshopOutModule,
    WoodArrivalModule,
    WoodShipmentModule,
    WarehouseModule,
    DataManagementModule,
    SupplierModule,
    BuyerModule,
    PersonInChargeModule,
  ],
})
export class AppModule {}
