import { Module } from '@nestjs/common';
import { BeamSizeService } from './beam-size.service';
import { BeamSizeController } from './beam-size.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { BeamSize } from './beam-size.model';
import { BeamIn } from 'src/beam-in/beam-in.model';
import { AuthModule } from 'src/auth/auth.module';
import { BeamShipment } from 'src/beam-shipment/beam-shipment.model';

@Module({
  providers: [BeamSizeService],
  controllers: [BeamSizeController],
  imports: [
    SequelizeModule.forFeature([BeamSize, BeamIn, BeamShipment]),
    AuthModule,
  ],
  exports: [BeamSizeService],
})
export class BeamSizeModule {}
