import { Module } from '@nestjs/common';
import { PersonInChargeController } from './person-in-charge.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { PersonInCharge } from './person-in-charge.model';
import { PersonInChargeService } from './person-in-charge.service';
import { AuthModule } from 'src/auth/auth.module';
import { WoodShipment } from 'src/wood-shipment/wood-shipment.model';

@Module({
  controllers: [PersonInChargeController],
  providers: [PersonInChargeService],
  imports: [
    SequelizeModule.forFeature([PersonInCharge, WoodShipment]),
    AuthModule,
  ],
  exports: [PersonInChargeService],
})
export class PersonInChargeModule {}
