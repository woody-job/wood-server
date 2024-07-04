import { Module } from '@nestjs/common';
import { BuyerController } from './buyer.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Buyer } from './buyer.model';
import { BuyerService } from './buyer.service';
import { AuthModule } from 'src/auth/auth.module';
import { WoodShipment } from 'src/wood-shipment/wood-shipment.model';

@Module({
  controllers: [BuyerController],
  providers: [BuyerService],
  imports: [SequelizeModule.forFeature([Buyer, WoodShipment]), AuthModule],
  exports: [BuyerService],
})
export class BuyerModule {}
