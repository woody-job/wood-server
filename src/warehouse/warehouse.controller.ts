import { Controller, Delete, Get, Param } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Склад')
@Controller('warehouse')
export class WarehouseController {
  constructor(private warehouseService: WarehouseService) {}

  @ApiOperation({
    summary: 'Получение доски на складе по ее состоянию (сырая/сухая)',
  })
  @Get('/:woodConditionId')
  getAll(@Param('woodConditionId') woodConditionId: string) {
    return this.warehouseService.getAllWarehouseRecordsByWoodCondition(
      Number(woodConditionId),
    );
  }

  @ApiOperation({ summary: 'Удаление записи склада' })
  @Delete('/:warehouseRecordId')
  delete(@Param('warehouseRecordId') warehouseRecordId: string) {
    return this.warehouseService.deleteWarehouseRecord(
      Number(warehouseRecordId),
    );
  }
}
