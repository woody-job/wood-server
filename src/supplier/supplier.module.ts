import { Module } from '@nestjs/common';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Supplier } from './supplier.model';
import { AuthModule } from 'src/auth/auth.module';
import { WoodArrival } from 'src/wood-arrival/wood-arrival.model';
import { BeamArrival } from 'src/beam-arrival/beam-arrival.model';

@Module({
  controllers: [SupplierController],
  providers: [SupplierService],
  imports: [
    SequelizeModule.forFeature([Supplier, WoodArrival, BeamArrival]),
    AuthModule,
  ],
  exports: [SupplierService],
})
export class SupplierModule {}
