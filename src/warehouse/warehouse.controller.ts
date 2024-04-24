import { Controller, Delete, Get, Param } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';

@Controller('warehouse')
export class WarehouseController {
  constructor(private warehouseService: WarehouseService) {}

  @Get('/:woodConditionId')
  getAll(@Param('woodConditionId') woodConditionId: string) {
    return this.warehouseService.getAllWarehouseRecordsByWoodCondition(
      Number(woodConditionId),
    );
  }

  @Delete('/:warehouseRecordId')
  delete(@Param('warehouseRecordId') warehouseRecordId: string) {
    return this.warehouseService.deleteWarehouseRecord(
      Number(warehouseRecordId),
    );
  }
}
