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
import { WoodArrivalService } from './wood-arrival.service';
import { CreateWoodArrivalDto } from './dtos/create-wood-arrival.dto';
import { UpdateWoodArrivalDto } from './dtos/update-wood-arrival.dto';
import { WoodCondition } from 'src/wood-condition/wood-condition.model';

@Controller('wood-arrival')
export class WoodArrivalController {
  constructor(private woodArrivalService: WoodArrivalService) {}

  @Post()
  create(@Body() woodArrivalDto: CreateWoodArrivalDto) {
    return this.woodArrivalService.createWoodArrival(woodArrivalDto);
  }

  @Put('/:woodArrivalId')
  edit(
    @Param('woodArrivalId') woodArrivalId: string,
    @Body() woodArrivalDto: UpdateWoodArrivalDto,
  ) {
    return this.woodArrivalService.editWoodArrival(
      Number(woodArrivalId),
      woodArrivalDto,
    );
  }

  @Get('/:woodConditionId')
  getAll(
    @Param('woodConditionId') woodConditionId: string,
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
  ) {
    return this.woodArrivalService.getAllWoodArrivalsByWoodCondition({
      woodConditionId: Number(woodConditionId),
      startDate,
      endDate,
    });
  }

  @Delete('/:woodArrivalId')
  delete(@Param('woodArrivalId') woodArrivalId: string) {
    return this.woodArrivalService.deleteWoodArrival(Number(woodArrivalId));
  }
}
