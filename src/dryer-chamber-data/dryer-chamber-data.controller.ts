import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DryerChamberDataService } from './dryer-chamber-data.service';
import { CreateDryerChamberDataDto } from './dtos/create-dryer-chamber-data.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Сушильные камеры')
@Controller('dryer-chamber-data')
export class DryerChamberDataController {
  constructor(private dryerChamberDataService: DryerChamberDataService) {}

  @ApiOperation({
    summary: 'Получение сохнущей доски в сушилке',
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
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
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/list')
  getDrying() {
    return this.dryerChamberDataService.getAllDryingWood();
  }

  // Для тестирования
  @ApiOperation({
    summary: 'Получение всех записей о доске в сушилках',
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/all-records')
  getAll() {
    return this.dryerChamberDataService.getAllRecords();
  }

  @ApiOperation({
    summary: 'Получение свода по сушилкам для статистики',
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/get/stats')
  getStats() {
    return this.dryerChamberDataService.getOverallDryersStats();
  }

  @ApiOperation({
    summary: 'Занесение доски в сушилку',
  })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @Post('/bring-in/:dryerChamberId')
  bringIn(
    @Param('dryerChamberId') dryerChamberId: string,
    @Body() dryerChamberDataDtos: CreateDryerChamberDataDto[],
  ) {
    return this.dryerChamberDataService.bringWoodInChamber(
      Number(dryerChamberId),
      dryerChamberDataDtos,
    );
  }

  @ApiOperation({
    summary: 'Вынос доски из сушилки',
  })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @Post('/take-out/:dryerChamberId')
  takeOut(@Param('dryerChamberId') dryerChamberId: string) {
    return this.dryerChamberDataService.removeWoodFromChamber(
      Number(dryerChamberId),
    );
  }

  // В ui нет такого запроса
  @ApiOperation({
    summary: 'Удаление записи о доске в сушилке',
  })
  @Delete('/:dryerChamberDataId')
  delete(@Param('dryerChamberDataId') dryerChamberDataId: string) {
    return this.dryerChamberDataService.eraseRecord(Number(dryerChamberDataId));
  }
}
