import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WoodConditionService } from './wood-condition.service';
import { CreateWoodConditionDto } from './dtos/create-wood-condition.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Состояние доски (сухая, сырая)')
@Controller('wood-condition')
export class WoodConditionController {
  constructor(private woodConditionService: WoodConditionService) {}

  @ApiOperation({ summary: 'Получение списка всех состояний' })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
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
