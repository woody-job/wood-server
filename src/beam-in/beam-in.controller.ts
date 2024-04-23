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
import { AddBeamInDto } from './dtos/add-beam-in.dto';
import { BeamInService } from './beam-in.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateBeamInDto } from './dtos/update-beam-in.dto';

@ApiTags('Вход леса в цеха')
@Controller('beam-in')
export class BeamInController {
  constructor(private beamInService: BeamInService) {}

  @ApiOperation({ summary: 'Добавление леса на вход в цех' })
  @Post()
  add(@Body() beamInDto: AddBeamInDto) {
    return this.beamInService.addBeamToWorkshop(beamInDto);
  }

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

  @ApiOperation({ summary: 'Удаление входа леса в цех' })
  @Delete('/:beamInId')
  delete(@Param('beamInId') beamInId: string) {
    return this.beamInService.deleteBeamInFromWorkshop(Number(beamInId));
  }
}
