import { Module } from '@nestjs/common';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Supplier } from './supplier.model';

@Module({
  controllers: [SupplierController],
  providers: [SupplierService],
  imports: [SequelizeModule.forFeature([Supplier])],
})
export class SupplierModule {}
