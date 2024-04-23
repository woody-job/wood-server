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
import { WorkshopOutService } from './workshop-out.service';
import { CreateWorkshopOutDto } from './dtos/create-workshop-out.dto';
import { UpdateWorkshopOutDto } from './dtos/update-workshop-out.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Выход доски из цеха')
@Controller('workshop-out')
export class WorkshopOutController {
  constructor(private workshopOutService: WorkshopOutService) {}

  @ApiOperation({ summary: 'Добавление выхода доски из цеха' })
  @Post()
  add(@Body() workshopOutDto: CreateWorkshopOutDto) {
    return this.workshopOutService.addWoodOutputToWorkshop(workshopOutDto);
  }

  @ApiOperation({ summary: 'Редактирование выхода доски из цеха' })
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
  @Get('/list/:workshopId')
  getAll(
    @Param('workshopId') workshopId: string,
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
  ) {
    return this.workshopOutService.getAllWoodOutForWorkshop({
      workshopId: Number(workshopId),
      startDate,
      endDate,
    });
  }

  @ApiOperation({ summary: 'Удаление выхода доски из цеха' })
  @Delete('/:workshopOutId')
  delete(@Param('workshopOutId') workshopOutId: string) {
    return this.workshopOutService.deleteWorkshopOutFromWorkshop(
      Number(workshopOutId),
    );
  }
}
