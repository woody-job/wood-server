import { Module } from '@nestjs/common';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Supplier } from './supplier.model';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [SupplierController],
  providers: [SupplierService],
  imports: [SequelizeModule.forFeature([Supplier]), AuthModule],
})
export class SupplierModule {}
