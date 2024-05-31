import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Склад')
@Controller('warehouse')
export class WarehouseController {
  constructor(private warehouseService: WarehouseService) {}

  @ApiOperation({
    summary: 'Получение доски на складе по ее состоянию (сырая/сухая)',
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/:woodConditionId')
  getAll(@Param('woodConditionId') woodConditionId: string) {
    return this.warehouseService.getAllWarehouseRecordsByWoodCondition(
      Number(woodConditionId),
    );
  }

  @ApiOperation({
    summary: 'Получение свода по складу для статистики',
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/get/stats')
  getStats() {
    return this.warehouseService.getOverralWarehouseStats();
  }

  @ApiOperation({ summary: 'Удаление записи склада' })
  @Delete('/:warehouseRecordId')
  delete(@Param('warehouseRecordId') warehouseRecordId: string) {
    return this.warehouseService.deleteWarehouseRecord(
      Number(warehouseRecordId),
    );
  }
}
