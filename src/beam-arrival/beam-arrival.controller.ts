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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BeamArrivalService } from './beam-arrival.service';
import { CreateBeamArrivalDto } from './dtos/create-beam-arrival.dto';
import { UpdateBeamArrivalDto } from './dtos/update-beam-arrival.dto';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Поступления сырья')
@Controller('beam-arrival')
export class BeamArrivalController {
  constructor(private beamArrivalService: BeamArrivalService) {}

  @ApiOperation({ summary: 'Добавление поступления сырья' })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() beamArrivalDtos: CreateBeamArrivalDto[]) {
    return this.beamArrivalService.createBeamArrivals(beamArrivalDtos);
  }

  @ApiOperation({ summary: 'Редактирование поступления сырья' })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @Put('/:beamArrivalId')
  edit(
    @Param('beamArrivalId') beamArrivalId: string,
    @Body() beamArrivalDto: UpdateBeamArrivalDto,
  ) {
    return this.beamArrivalService.editBeamArrival(
      Number(beamArrivalId),
      beamArrivalDto,
    );
  }

  @ApiOperation({
    summary: 'Получение поступлений сырья с возможностью фильтрации по датам',
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/get/time-range-stats')
  getAll(
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
  ) {
    return this.beamArrivalService.getAllBeamArrivals({
      startDate,
      endDate,
    });
  }

  @ApiOperation({
    summary: `Получение поступлений сырья для страницы поступлений сырья для конкретного дня (таблица)`,
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/get/day-data-stats')
  getArrivalDayStats(@Query('date') date) {
    return this.beamArrivalService.getBeamArrivalStatsForDay({
      date,
    });
  }

  @ApiOperation({ summary: 'Удаление поступления сырья' })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @Delete('/:beamArrivalId')
  delete(@Param('beamArrivalId') beamArrivalId: string) {
    return this.beamArrivalService.deleteBeamArrival(Number(beamArrivalId));
  }
}
