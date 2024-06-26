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
import { WorkshopOutService } from './workshop-out.service';
import { CreateWorkshopOutDto } from './dtos/create-workshop-out.dto';
import { UpdateWorkshopOutDto } from './dtos/update-workshop-out.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Выход доски из цеха')
@Controller('workshop-out')
export class WorkshopOutController {
  constructor(private workshopOutService: WorkshopOutService) {}

  @ApiOperation({ summary: 'Добавление выхода доски из цеха' })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @Post()
  add(@Body() workshopOutDto: CreateWorkshopOutDto) {
    return this.workshopOutService.addWoodOutputToWorkshop(workshopOutDto);
  }

  @ApiOperation({ summary: 'Редактирование выхода доски из цеха' })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
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
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
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
    summary: 'Получение сгруппированных данных о работе цеха за выбранные дни',
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/get/workshop-stats/report/:workshopId')
  getReport(
    @Param('workshopId') workshopId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.workshopOutService.getWorkshopOutReportForMultipleDays({
      workshopId: Number(workshopId),
      startDate,
      endDate,
    });
  }

  @ApiOperation({ summary: 'Удаление выхода доски из цеха' })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @Delete('/:workshopOutId')
  delete(@Param('workshopOutId') workshopOutId: string) {
    return this.workshopOutService.deleteWorkshopOutFromWorkshop(
      Number(workshopOutId),
    );
  }
}
