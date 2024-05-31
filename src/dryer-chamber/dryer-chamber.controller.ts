import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { DryerChamberService } from './dryer-chamber.service';
import { CreateDryerChamberDto } from './dtos/create-dryer-chamber.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Сушильные камеры')
@Controller('dryer-chamber')
export class DryerChamberController {
  constructor(private dryerChamberService: DryerChamberService) {}

  @ApiOperation({
    summary: 'Создание сушилки',
  })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() dryerChamberDto: CreateDryerChamberDto) {
    return this.dryerChamberService.createDryerChamber(dryerChamberDto);
  }

  @ApiOperation({
    summary: 'Обновление названия сушилки',
  })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
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
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/list')
  getAll() {
    return this.dryerChamberService.getAllDryerChambers();
  }

  @ApiOperation({
    summary: 'Удаление сушилки',
  })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Delete('/:dryerChamberId')
  delete(@Param('dryerChamberId') dryerChamberId: string) {
    return this.dryerChamberService.deleteDryerChamber(Number(dryerChamberId));
  }
}
