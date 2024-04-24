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

@Controller('wood-shipment')
export class WoodShipmentController {
  constructor(private woodShipmentService: WoodShipmentService) {}

  @Post()
  create(@Body() woodShipmentDto: CreateWoodShipmentDto) {
    return this.woodShipmentService.createWoodShipment(woodShipmentDto);
  }

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

  @Delete('/:woodShipmentId')
  delete(@Param('woodShipmentId') woodShipmentId: string) {
    return this.woodShipmentService.deleteWoodShipment(Number(woodShipmentId));
  }
}
