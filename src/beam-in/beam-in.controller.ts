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
import { AddBeamInDto } from './dtos/add-beam-in.dto';
import { BeamInService } from './beam-in.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateBeamInDto } from './dtos/update-beam-in.dto';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Вход леса в цеха')
@Controller('beam-in')
export class BeamInController {
  constructor(private beamInService: BeamInService) {}

  @ApiOperation({ summary: 'Добавление леса на вход в цех' })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @Post()
  add(@Body() beamInDto: AddBeamInDto) {
    return this.beamInService.addBeamToWorkshop(beamInDto);
  }

  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Редактирование записи входа леса в цех' })
  @Put('/:beamInId')
  edit(
    @Param('beamInId') beamInId: string,
    @Body() beamInDto: UpdateBeamInDto,
  ) {
    return this.beamInService.editBeamGoneToWorkshop(
      Number(beamInId),
      beamInDto,
    );
  }

  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary:
      'Получение списка входа леса в цех с возможностью фильтрации по дате',
  })
  @Get('/list/:workshopId')
  getAll(
    @Param('workshopId') workshopId: string,
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
  ) {
    return this.beamInService.getAllBeamInForWorkshop({
      workshopId: Number(workshopId),
      startDate,
      endDate,
    });
  }

  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Получение свода входа для цеха за выбранные дни',
  })
  @Get('/get/workshop-stats/:workshopId')
  getStatsForWorkshop(
    @Param('workshopId') workshopId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.beamInService.getWorkshopsStatsByTimespan({
      workshopId: Number(workshopId),
      startDate,
      endDate,
    });
  }

  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Удаление входа леса в цех' })
  @Delete('/:beamInId')
  delete(@Param('beamInId') beamInId: string) {
    return this.beamInService.deleteBeamInFromWorkshop(Number(beamInId));
  }
}
