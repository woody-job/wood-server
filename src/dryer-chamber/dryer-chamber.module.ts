import { Module, forwardRef } from '@nestjs/common';
import { DryerChamberController } from './dryer-chamber.controller';
import { DryerChamberService } from './dryer-chamber.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { DryerChamber } from './dryer-chamber.model';
import { DryerChamberData } from 'src/dryer-chamber-data/dryer-chamber-data.model';
import { DryerChamberDataModule } from 'src/dryer-chamber-data/dryer-chamber-data.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [DryerChamberController],
  providers: [DryerChamberService],
  imports: [
    SequelizeModule.forFeature([DryerChamber, DryerChamberData]),
    forwardRef(() => DryerChamberDataModule),
    AuthModule,
  ],
  exports: [DryerChamberService],
})
export class DryerChamberModule {}
