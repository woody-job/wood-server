import { Module } from '@nestjs/common';
import { BeamWarehouseService } from './beam-warehouse.service';
import { BeamWarehouseController } from './beam-warehouse.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { BeamWarehouse } from './beam-warehouse.model';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';
import { BeamSize } from 'src/beam-size/beam-size.model';
import { WoodNamingModule } from 'src/wood-naming/wood-naming.module';
import { BeamSizeModule } from 'src/beam-size/beam-size.module';
import { WoodTypeModule } from 'src/wood-type/wood-type.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [BeamWarehouseService],
  imports: [
    SequelizeModule.forFeature([BeamWarehouse, WoodNaming, BeamSize]),
    WoodNamingModule,
    BeamSizeModule,
    WoodTypeModule,
    AuthModule,
  ],
  controllers: [BeamWarehouseController],
  exports: [BeamWarehouseService],
})
export class BeamWarehouseModule {}
