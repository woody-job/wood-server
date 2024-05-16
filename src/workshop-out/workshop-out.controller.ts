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
import { WorkshopOutService } from './workshop-out.service';
import { CreateWorkshopOutDto } from './dtos/create-workshop-out.dto';
import { UpdateWorkshopOutDto } from './dtos/update-workshop-out.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Выход доски из цеха')
@Controller('workshop-out')
export class WorkshopOutController {
  constructor(private workshopOutService: WorkshopOutService) {}

  @ApiOperation({ summary: 'Добавление выхода доски из цеха' })
  @Post()
  add(@Body() workshopOutDto: CreateWorkshopOutDto) {
    return this.workshopOutService.addWoodOutputToWorkshop(workshopOutDto);
  }

  @ApiOperation({ summary: 'Редактирование выхода доски из цеха' })
  @Put('/:workshopOutId')
  edit(
    @Param('workshopOutId') workshopOutId: string,
    @Body() workshopOutDto: UpdateWorkshopOutDto,
  ) {
    return this.workshopOutService.editWoodFromWorkshop(
      Number(workshopOutId),
      workshopOutDto,
    );
  }

  @ApiOperation({
    summary:
      'Получение списка выхода из цеха с возможностью фильтрации по дате',
  })
  @Get('/day-data/:workshopId')
  getAllForADay(
    @Param('workshopId') workshopId: string,
    @Query('date') date: string,
  ) {
    return this.workshopOutService.getAllWoodOutForWorkshopForADay({
      workshopId: Number(workshopId),
      date,
    });
  }

  @ApiOperation({
    summary: 'Получение свода по цехам для статистики',
  })
  @Get('/get/stats')
  getStats() {
    return this.workshopOutService.getOverallWorkshopsStats();
  }

  @ApiOperation({
    summary: 'Получение выхода для цеха как для чартов на странице статистики',
  })
  @Get('/get/workshop-stats/:workshopId')
  getStatsForWorkshop(
    @Param('workshopId') workshopId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.workshopOutService.getWorkshopsStatsByTimespan({
      workshopId: Number(workshopId),
      startDate,
      endDate,
    });
  }

  @ApiOperation({
    summary: 'Получение итоговой прибыли для цеха за выбранные дни',
  })
  @Get('/get/workshop-stats/profit/:workshopId')
  getProfitStats(
    @Param('workshopId') workshopId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('perUnit') perUnit: string,
  ) {
    let isPerUnitSearch = false;

    if (perUnit === 'true') {
      isPerUnitSearch = true;
    }

    return this.workshopOutService.getProfitStatsByTimespan({
      workshopId: Number(workshopId),
      startDate,
      endDate,
      isPerUnitSearch,
    });
  }

  @ApiOperation({
    summary: 'Получение свода о произведенной доске в цехах',
  })
  @Get('/get/produced-stats')
  getProducedWoodStats(
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
  ) {
    return this.workshopOutService.getProducedWoodStats({ startDate, endDate });
  }

  @ApiOperation({ summary: 'Удаление выхода доски из цеха' })
  @Delete('/:workshopOutId')
  delete(@Param('workshopOutId') workshopOutId: string) {
    return this.workshopOutService.deleteWorkshopOutFromWorkshop(
      Number(workshopOutId),
    );
  }
}
