import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { WoodConditionService } from './wood-condition.service';
import { CreateWoodConditionDto } from './dtos/create-wood-condition.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Состояние доски (сухая, сырая)')
@Controller('wood-condition')
export class WoodConditionController {
  constructor(private woodConditionService: WoodConditionService) {}

  @ApiOperation({ summary: 'Получение списка всех состояний' })
  @Get('/list')
  getAll() {
    return this.woodConditionService.getAllWoodConditions();
  }

  @ApiOperation({ summary: 'Создание состояния доски' })
  @Post()
  create(@Body() woodConditionDto: CreateWoodConditionDto) {
    return this.woodConditionService.createWoodCondition(woodConditionDto);
  }

  @ApiOperation({ summary: 'Удаление состояния доски' })
  @Delete('/:id')
  delete(@Param('id') woodConditionId: string) {
    return this.woodConditionService.deleteWoodCondition(
      Number(woodConditionId),
    );
  }
}
