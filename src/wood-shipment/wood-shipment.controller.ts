import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreateWoodShipmentDto } from './dtos/create-wood-shipment.dto';
import { UpdateWoodShipmentDto } from './dtos/update-wood-shipment.dto';
import { WoodShipmentService } from './wood-shipment.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Отгрузки доски')
@Controller('wood-shipment')
export class WoodShipmentController {
  constructor(private woodShipmentService: WoodShipmentService) {}

  @ApiOperation({ summary: 'Добавление отгрузки доски' })
  @Post()
  create(@Body() woodShipmentDto: CreateWoodShipmentDto) {
    return this.woodShipmentService.createWoodShipment(woodShipmentDto);
  }

  @ApiOperation({ summary: 'Редактирование отгрузки доски' })
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

  @ApiOperation({ summary: 'Удаление отгрузки доски' })
  @Delete('/:woodShipmentId')
  delete(@Param('woodShipmentId') woodShipmentId: string) {
    return this.woodShipmentService.deleteWoodShipment(Number(woodShipmentId));
  }
}
