import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WorkshopDailyDataService } from './workshop-daily-data.service';
import { UpdateDailyDimensionDto } from './dtos/update-daily-dimension.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateDailyWoodNamingDto } from './dtos/update-daily-wood-naming.dto';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Ежедневные данные цеха (сечение дня и условное обозначение дня)')
@Controller('workshop-daily-data')
export class WorkshopDailyDataController {
  constructor(private workshopDailyDataService: WorkshopDailyDataService) {}

  @ApiOperation({
    summary: 'Выбор сечения дня для цеха',
  })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
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
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
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
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/list')
  getAll() {
    return this.workshopDailyDataService.getAllWorkshopDailyData();
  }

  @ApiOperation({
    summary: 'Получение свода ежедневных данных для цеха',
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
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
