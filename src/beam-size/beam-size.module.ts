import { Module } from '@nestjs/common';
import { BeamSizeService } from './beam-size.service';
import { BeamSizeController } from './beam-size.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { BeamSize } from './beam-size.model';
import { BeamIn } from 'src/beam-in/beam-in.model';

@Module({
  providers: [BeamSizeService],
  controllers: [BeamSizeController],
  imports: [SequelizeModule.forFeature([BeamSize, BeamIn])],
  exports: [BeamSizeService],
})
export class BeamSizeModule {}
