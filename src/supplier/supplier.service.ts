import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Supplier } from './supplier.model';
import { CreateSupplierDto } from './dtos/create-supplier.dto';

@Injectable()
export class SupplierService {
  constructor(
    @InjectModel(Supplier)
    private supplierRepository: typeof Supplier,
  ) {}

  async getAllSuppliers() {
    const suppliers = await this.supplierRepository.findAll({
      order: [['id', 'DESC']],
    });

    return suppliers;
  }

  async createSupplier(supplierDto: CreateSupplierDto) {
    const { name } = supplierDto;

    const existingSupplier = await this.supplierRepository.findOne({
      where: {
        name,
      },
    });

    if (existingSupplier) {
      throw new HttpException(
        'Поставщик с таким наименованием уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const supplier = await this.supplierRepository.create(supplierDto);

    return supplier;
  }

  async updateSupplier(supplierId: number, supplierDto: CreateSupplierDto) {
    const { name } = supplierDto;
    const supplier = await this.supplierRepository.findByPk(supplierId);

    if (!supplier) {
      throw new HttpException(
        'Выбранный поставщик не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    supplier.name = name;

    await supplier.save();

    return supplier;
  }

  async deleteSupplier(supplierId: number) {
    const supplier = await this.supplierRepository.findByPk(supplierId);

    if (!supplier) {
      throw new HttpException(
        'Выбранный поставщик не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    await supplier.destroy();
  }

  async findSupplierById(supplierId: number) {
    const supplier = await this.supplierRepository.findByPk(supplierId);

    return supplier;
  }
}
