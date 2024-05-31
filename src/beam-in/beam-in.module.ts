import { Module } from '@nestjs/common';
import { BeamInController } from './beam-in.controller';
import { BeamInService } from './beam-in.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { BeamIn } from './beam-in.model';
import { Workshop } from 'src/workshop/workshop.model';
import { WorkshopModule } from 'src/workshop/workshop.module';
import { BeamSize } from 'src/beam-size/beam-size.model';
import { BeamSizeModule } from 'src/beam-size/beam-size.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [BeamInController],
  providers: [BeamInService],
  imports: [
    SequelizeModule.forFeature([BeamIn, Workshop, BeamSize]),
    WorkshopModule,
    BeamSizeModule,
    AuthModule,
  ],
  exports: [BeamInService],
})
export class BeamInModule {}
