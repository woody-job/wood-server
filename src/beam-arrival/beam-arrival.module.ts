import { Module } from '@nestjs/common';
import { BeamArrivalController } from './beam-arrival.controller';
import { BeamArrivalService } from './beam-arrival.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { BeamArrival } from './beam-arrival.model';
import { Supplier } from 'src/supplier/supplier.model';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';
import { WoodType } from 'src/wood-type/wood-type.model';
import { SupplierModule } from 'src/supplier/supplier.module';
import { WoodNamingModule } from 'src/wood-naming/wood-naming.module';
import { WoodTypeModule } from 'src/wood-type/wood-type.module';
import { BeamSize } from 'src/beam-size/beam-size.model';
import { BeamSizeModule } from 'src/beam-size/beam-size.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [BeamArrivalController],
  imports: [
    SequelizeModule.forFeature([
      BeamArrival,
      Supplier,
      WoodNaming,
      WoodType,
      BeamSize,
    ]),
    SupplierModule,
    WoodNamingModule,
    WoodTypeModule,
    BeamSizeModule,
    AuthModule,
  ],
  providers: [BeamArrivalService],
})
export class BeamArrivalModule {}
