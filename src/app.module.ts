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
      models: [User, Role],
      autoLoadModels: true,
    }),
    UsersModule,
    RolesModule,
    AuthModule,
    WoodConditionModule,
    WoodTypeModule,
    WoodClassModule,
    DimensionModule,
    WoodNamingModule,
  ],
})
export class AppModule {}
