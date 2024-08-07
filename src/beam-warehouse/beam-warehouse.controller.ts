import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BeamWarehouseService } from './beam-warehouse.service';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Склад сырья')
@Controller('beam-warehouse')
export class BeamWarehouseController {
  constructor(private beamWarehouseService: BeamWarehouseService) {}

  @ApiOperation({
    summary: 'Получение доски на складе по ее состоянию (сырая/сухая)',
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get()
  getAll() {
    return this.beamWarehouseService.getAllWarehouseRecords();
  }

  @ApiOperation({
    summary: 'Получение свода по складу для статистики',
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/get/stats')
  getStats() {
    return this.beamWarehouseService.getOverralWarehouseStats();
  }

  @ApiOperation({ summary: 'Удаление записи склада' })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Delete('/:warehouseRecordId')
  delete(@Param('warehouseRecordId') warehouseRecordId: string) {
    return this.beamWarehouseService.deleteWarehouseRecord(
      Number(warehouseRecordId),
    );
  }

  // @Get('/adventure')
  // mergeRecords() {
  //   return this.beamWarehouseService.mergeWarehouseRecords();
  // }
}
