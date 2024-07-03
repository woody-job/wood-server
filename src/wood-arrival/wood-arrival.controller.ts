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
import { WoodArrivalService } from './wood-arrival.service';
import { CreateWoodArrivalDto } from './dtos/create-wood-arrival.dto';
import { UpdateWoodArrivalDto } from './dtos/update-wood-arrival.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Поступления доски')
@Controller('wood-arrival')
export class WoodArrivalController {
  constructor(private woodArrivalService: WoodArrivalService) {}

  @ApiOperation({ summary: 'Добавление поступления доски' })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() woodArrivalDto: CreateWoodArrivalDto) {
    return this.woodArrivalService.createWoodArrival(woodArrivalDto);
  }

  @ApiOperation({ summary: 'Редактирование поступления доски' })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
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
    summary: 'Получение всех поступленний с возможностью фильтрации по датам',
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/get/time-range-stats')
  getAll(
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
  ) {
    return this.woodArrivalService.getAllWoodArrivalsByWoodCondition({
      startDate,
      endDate,
    });
  }

  @Get(':woodConditionId')
  getAllByCondition(
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
      поступлений для конкретного дня (таблица)`,
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/get/day-data-stats/:woodConditionId')
  getArrivalDayStats(
    @Param('woodConditionId') woodConditionId: string,
    @Query('date') date,
  ) {
    return this.woodArrivalService.getWoodArrivalStatsByWoodConditionForDay({
      woodConditionId: Number(woodConditionId),
      date,
    });
  }

  @ApiOperation({ summary: 'Удаление поступления доски' })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @Delete('/:woodArrivalId')
  delete(@Param('woodArrivalId') woodArrivalId: string) {
    return this.woodArrivalService.deleteWoodArrival(Number(woodArrivalId));
  }
}
