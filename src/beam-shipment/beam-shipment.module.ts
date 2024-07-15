import { Module } from '@nestjs/common';
import { BeamShipmentController } from './beam-shipment.controller';
import { BeamShipmentService } from './beam-shipment.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { BeamShipment } from './beam-shipment.model';
import { Buyer } from 'src/buyer/buyer.model';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';
import { WoodType } from 'src/wood-type/wood-type.model';
import { BuyerModule } from 'src/buyer/buyer.module';
import { WoodNamingModule } from 'src/wood-naming/wood-naming.module';
import { WoodTypeModule } from 'src/wood-type/wood-type.module';
import { BeamSize } from 'src/beam-size/beam-size.model';
import { BeamSizeModule } from 'src/beam-size/beam-size.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [BeamShipmentController],
  imports: [
    SequelizeModule.forFeature([
      BeamShipment,
      Buyer,
      WoodNaming,
      WoodType,
      BeamSize,
    ]),
    BuyerModule,
    WoodNamingModule,
    WoodTypeModule,
    BeamSizeModule,
    AuthModule,
  ],
  providers: [BeamShipmentService],
})
export class BeamShipmentModule {}
