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

@Module({
  controllers: [],
  providers: [],
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
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
  ],
})
export class AppModule {}
