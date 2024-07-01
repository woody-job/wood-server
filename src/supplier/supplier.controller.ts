import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dtos/create-supplier.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Поставщики')
@Controller('supplier')
export class SupplierController {
  constructor(private supplierService: SupplierService) {}

  @ApiOperation({ summary: 'Получение списка всех поставщиков' })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/list')
  getAll() {
    return this.supplierService.getAllSuppliers();
  }

  @ApiOperation({ summary: 'Создание поставщика' })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() supplierDto: CreateSupplierDto) {
    return this.supplierService.createSupplier(supplierDto);
  }

  @ApiOperation({ summary: 'Обновление поставщика' })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Put('/:supplierId')
  update(
    @Param('supplierId') supplierId: string,
    @Body() supplierDto: CreateSupplierDto,
  ) {
    return this.supplierService.updateSupplier(Number(supplierId), supplierDto);
  }

  @ApiOperation({ summary: 'Удаление поставщика' })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Delete(':supplierId')
  delete(@Param('supplierId') supplierId: string) {
    return this.supplierService.deleteSupplier(Number(supplierId));
  }
}
