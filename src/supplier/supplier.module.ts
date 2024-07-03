import { Module } from '@nestjs/common';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Supplier } from './supplier.model';
import { AuthModule } from 'src/auth/auth.module';
import { WoodArrival } from 'src/wood-arrival/wood-arrival.model';

@Module({
  controllers: [SupplierController],
  providers: [SupplierService],
  imports: [SequelizeModule.forFeature([Supplier, WoodArrival]), AuthModule],
  exports: [SupplierService],
})
export class SupplierModule {}
