import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { DryerChamberService } from './dryer-chamber.service';
import { CreateDryerChamberDto } from './dtos/create-dryer-chamber.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Сушильные камеры')
@Controller('dryer-chamber')
export class DryerChamberController {
  constructor(private dryerChamberService: DryerChamberService) {}

  @ApiOperation({
    summary: 'Создание сушилки',
  })
  @Post()
  create(@Body() dryerChamberDto: CreateDryerChamberDto) {
    return this.dryerChamberService.createDryerChamber(dryerChamberDto);
  }

  @ApiOperation({
    summary: 'Обновление названия сушилки',
  })
  @Put('/:dryerChamberId')
  update(
    @Param('dryerChamberId') dryerChamberId: string,
    @Body() dryerChamberDto: CreateDryerChamberDto,
  ) {
    return this.dryerChamberService.updateDryerChamber(
      Number(dryerChamberId),
      dryerChamberDto,
    );
  }

  @ApiOperation({
    summary: 'Получение списка всех сушилок',
  })
  @Get('/list')
  getAll() {
    return this.dryerChamberService.getAllDryerChambers();
  }

  @ApiOperation({
    summary: 'Удаление сушилки',
  })
  @Delete('/:dryerChamberId')
  delete(@Param('dryerChamberId') dryerChamberId: string) {
    return this.dryerChamberService.deleteDryerChamber(Number(dryerChamberId));
  }
}
