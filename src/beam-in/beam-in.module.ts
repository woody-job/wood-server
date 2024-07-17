import { Module, forwardRef } from '@nestjs/common';
import { BeamInController } from './beam-in.controller';
import { BeamInService } from './beam-in.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { BeamIn } from './beam-in.model';
import { Workshop } from 'src/workshop/workshop.model';
import { WorkshopModule } from 'src/workshop/workshop.module';
import { BeamSize } from 'src/beam-size/beam-size.model';
import { BeamSizeModule } from 'src/beam-size/beam-size.module';
import { AuthModule } from 'src/auth/auth.module';
import { WorkshopOutModule } from 'src/workshop-out/workshop-out.module';
import { BeamWarehouseModule } from 'src/beam-warehouse/beam-warehouse.module';
import { WoodNamingModule } from 'src/wood-naming/wood-naming.module';
import { WoodNaming } from 'src/wood-naming/wood-naming.model';

@Module({
  controllers: [BeamInController],
  providers: [BeamInService],
  imports: [
    SequelizeModule.forFeature([BeamIn, Workshop, BeamSize, WoodNaming]),
    WorkshopModule,
    BeamSizeModule,
    AuthModule,
    forwardRef(() => WorkshopOutModule),
    BeamWarehouseModule,
    WoodNamingModule,
  ],
  exports: [BeamInService],
})
export class BeamInModule {}
