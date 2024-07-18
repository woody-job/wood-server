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
import { BeamShipmentService } from './beam-shipment.service';
import { CreateBeamShipmentDto } from './dtos/create-beam-shipment.dto';
import { UpdateBeamShipmentDto } from './dtos/update-beam-shipment.dto';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Отгрузки сырья')
@Controller('beam-shipment')
export class BeamShipmentController {
  constructor(private beamShipmentService: BeamShipmentService) {}

  @ApiOperation({ summary: 'Добавление отгрузки сырья' })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() beamShipmentDtos: CreateBeamShipmentDto[]) {
    return this.beamShipmentService.createBeamShipments(beamShipmentDtos);
  }

  @ApiOperation({ summary: 'Редактирование отгрузки сырья' })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @Put('/:beamShipmentId')
  edit(
    @Param('beamShipmentId') beamShipmentId: string,
    @Body() beamShipmentDto: UpdateBeamShipmentDto,
  ) {
    return this.beamShipmentService.editBeamShipment(
      Number(beamShipmentId),
      beamShipmentDto,
    );
  }

  @ApiOperation({
    summary: 'Получение отгрузок сырья с возможностью фильтрации по датам',
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/get/time-range-stats')
  getAll(
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
  ) {
    return this.beamShipmentService.getAllBeamShipments({
      startDate,
      endDate,
    });
  }

  @ApiOperation({
    summary: `Получение отгрузок сырья для страницы отгрузок сырья для конкретного дня (таблица)`,
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/get/day-data-stats')
  getShipmentDayStats(@Query('date') date) {
    return this.beamShipmentService.getBeamShipmentStatsForDay({
      date,
    });
  }

  @ApiOperation({ summary: 'Удаление отгрузки сырья' })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @Delete('/:beamShipmentId')
  delete(@Param('beamShipmentId') beamShipmentId: string) {
    return this.beamShipmentService.deleteBeamShipment(Number(beamShipmentId));
  }
}
