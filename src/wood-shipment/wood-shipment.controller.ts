import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateWoodShipmentDto } from './dtos/create-wood-shipment.dto';
import { UpdateWoodShipmentDto } from './dtos/update-wood-shipment.dto';
import { WoodShipmentService } from './wood-shipment.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Отгрузки доски')
@Controller('wood-shipment')
export class WoodShipmentController {
  constructor(private woodShipmentService: WoodShipmentService) {}

  @ApiOperation({ summary: 'Добавление отгрузки доски' })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() woodShipmentDto: CreateWoodShipmentDto) {
    return this.woodShipmentService.createWoodShipment(woodShipmentDto);
  }

  @ApiOperation({ summary: 'Редактирование отгрузки доски' })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @Put('/:woodShipmentId')
  edit(
    @Param('woodShipmentId') woodShipmentId: string,
    @Body() woodShipmentDto: UpdateWoodShipmentDto,
  ) {
    return this.woodShipmentService.editWoodShipment(
      Number(woodShipmentId),
      woodShipmentDto,
    );
  }

  @ApiOperation({
    summary:
      'Получение отгрузок по состоянию доски (сырая/сухая) с возможностью фильтрации по датам',
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/:woodConditionId')
  getAll(
    @Param('woodConditionId') woodConditionId: string,
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
  ) {
    return this.woodShipmentService.getAllWoodShipmentsByWoodCondition({
      woodConditionId: Number(woodConditionId),
      startDate,
      endDate,
    });
  }

  @ApiOperation({
    summary: `Получение отгрузок по состоянию доски (сырая/сухая) для страницы 
    поступлений для конкретного дня (таблица + санберст)`,
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/get/day-data-stats/:woodConditionId')
  getShipmentDayStats(
    @Param('woodConditionId') woodConditionId: string,
    @Query('date') date,
  ) {
    return this.woodShipmentService.getWoodShipmentStatsByWoodConditionForDay({
      woodConditionId: Number(woodConditionId),
      date,
    });
  }

  @ApiOperation({ summary: 'Удаление отгрузки доски' })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @Delete('/:woodShipmentId')
  delete(@Param('woodShipmentId') woodShipmentId: string) {
    return this.woodShipmentService.deleteWoodShipment(Number(woodShipmentId));
  }
}
