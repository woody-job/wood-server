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
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Поступления доски')
@Controller('wood-arrival')
export class WoodArrivalController {
  constructor(private woodArrivalService: WoodArrivalService) {}

  @ApiOperation({ summary: 'Добавление поступления доски' })
  @Post()
  create(@Body() woodArrivalDto: CreateWoodArrivalDto) {
    return this.woodArrivalService.createWoodArrival(woodArrivalDto);
  }

  @ApiOperation({ summary: 'Редактирование поступления доски' })
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

  @ApiOperation({
    summary:
      'Получение поступленний по состоянию доски (сырая/сухая) с возможностью фильтрации по датам',
  })
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

  @ApiOperation({
    summary: `Получение поступленний по состоянию доски (сырая/сухая) для страницы 
      поступлений с возможностью фильтрации по датам`,
  })
  @Get('/get/stats/:woodConditionId')
  getArrivalStats(
    @Param('woodConditionId') woodConditionId: string,
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
  ) {
    return this.woodArrivalService.getWoodArrivalStatsByWoodCondition({
      woodConditionId: Number(woodConditionId),
      startDate,
      endDate,
    });
  }

  @ApiOperation({ summary: 'Удаление поступления доски' })
  @Delete('/:woodArrivalId')
  delete(@Param('woodArrivalId') woodArrivalId: string) {
    return this.woodArrivalService.deleteWoodArrival(Number(woodArrivalId));
  }
}
