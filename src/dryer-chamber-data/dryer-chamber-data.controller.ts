import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { DryerChamberDataService } from './dryer-chamber-data.service';
import { CreateDryerChamberDataDto } from './dtos/create-dryer-chamber-data.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Сушильные камеры')
@Controller('dryer-chamber-data')
export class DryerChamberDataController {
  constructor(private dryerChamberDataService: DryerChamberDataService) {}

  @ApiOperation({
    summary: 'Получение сохнущей доски в сушилке',
  })
  @Get('/list/:dryerChamberId')
  getDryingById(@Param('dryerChamberId') dryerChamberId: string) {
    return this.dryerChamberDataService.getDryingWoodByDryerChamberId(
      Number(dryerChamberId),
    );
  }

  // Для запроса на странице склада
  @ApiOperation({
    summary: 'Получение сохнущей доски во всех сушилках',
  })
  @Get('/list')
  getDrying() {
    return this.dryerChamberDataService.getAllDryingWood();
  }

  // Для тестирования
  @ApiOperation({
    summary: 'Получение всех записей о доске в сушилках',
  })
  @Get('/all-records')
  getAll() {
    return this.dryerChamberDataService.getAllRecords();
  }

  @ApiOperation({
    summary: 'Получение свода по сушилкам для статистики',
  })
  @Get('/get/stats')
  getStats() {
    return this.dryerChamberDataService.getOverallDryersStats();
  }

  @ApiOperation({
    summary: 'Получение данных по сушилке для ее санберста',
  })
  @Get('/get/chamber-data/:dryerChamberId')
  getChamberData(@Param('dryerChamberId') dryerChamberId: string) {
    return this.dryerChamberDataService.getChamberData(Number(dryerChamberId));
  }

  @ApiOperation({
    summary: 'Занесение доски в сушилку',
  })
  @Post('/bring-in/:dryerChamberId')
  bringIn(
    @Param('dryerChamberId') dryerChamberId: string,
    @Body() dryerChamberDataDto: CreateDryerChamberDataDto,
  ) {
    return this.dryerChamberDataService.bringWoodInChamber(
      Number(dryerChamberId),
      dryerChamberDataDto,
    );
  }

  @ApiOperation({
    summary: 'Вынос доски из сушилки',
  })
  @Post('/take-out/:dryerChamberId')
  takeOut(@Param('dryerChamberId') dryerChamberId: string) {
    return this.dryerChamberDataService.removeWoodFromChamber(
      Number(dryerChamberId),
    );
  }

  @ApiOperation({
    summary: 'Удаление записи о доске в сушилке',
  })
  @Delete('/:dryerChamberDataId')
  delete(@Param('dryerChamberDataId') dryerChamberDataId: string) {
    return this.dryerChamberDataService.eraseRecord(Number(dryerChamberDataId));
  }
}
