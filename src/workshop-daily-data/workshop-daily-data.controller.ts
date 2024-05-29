import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { WorkshopDailyDataService } from './workshop-daily-data.service';
import { UpdateDailyDimensionDto } from './dtos/update-daily-dimension.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateDailyWoodNamingDto } from './dtos/update-daily-wood-naming.dto';

@ApiTags('Ежедневные данные цеха (сечение дня и условное обозначение дня)')
@Controller('workshop-daily-data')
export class WorkshopDailyDataController {
  constructor(private workshopDailyDataService: WorkshopDailyDataService) {}

  @ApiOperation({
    summary: 'Выбор сечения дня для цеха',
  })
  @Post('/dimension')
  updateDailyDimension(
    @Body() workshopDailyDimensionDto: UpdateDailyDimensionDto,
  ) {
    return this.workshopDailyDataService.updateDailyDimension(
      workshopDailyDimensionDto,
    );
  }

  @ApiOperation({
    summary: 'Выбор условного обозначения дня для цеха',
  })
  @Post('/wood-naming')
  updateDailyWoodNaming(
    @Body() workshopDailyWoodNamingDto: UpdateDailyWoodNamingDto,
  ) {
    return this.workshopDailyDataService.updateDailyWoodNaming(
      workshopDailyWoodNamingDto,
    );
  }

  @ApiOperation({
    summary: 'Получение списка всех ежедневных данных всех цехов',
  })
  @Get('/list')
  getAll() {
    return this.workshopDailyDataService.getAllWorkshopDailyData();
  }

  @ApiOperation({
    summary: 'Получение свода ежедневных данных для цеха',
  })
  @Get('/get/daily-stats/:workshopId')
  getDailyStats(
    @Param('workshopId') workshopId: string,
    @Query('date') date: string,
  ) {
    return this.workshopDailyDataService.getDailyStatsForWorkshop(
      Number(workshopId),
      date,
    );
  }

  @ApiOperation({ summary: 'Удаление ежедневных данных' })
  @Delete('/:workshopDailyDataId')
  delete(@Param('workshopDailyDataId') workshopDailyDataId: string) {
    return this.workshopDailyDataService.deleteWorkshopDailyData(
      Number(workshopDailyDataId),
    );
  }
}
