import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { WoodNamingService } from './wood-naming.service';
import { CreateWoodNamingDto } from './dtos/create-wood-naming.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Условные обозначения леса')
@Controller('wood-naming')
export class WoodNamingController {
  constructor(private woodNamingService: WoodNamingService) {}

  @ApiOperation({ summary: 'Получение списка всех условных обозначений' })
  @Get('/list')
  getAll() {
    return this.woodNamingService.getAllWoodNamings();
  }

  @ApiOperation({ summary: 'Создание условного обозначения' })
  @Post()
  create(@Body() woodNamingDto: CreateWoodNamingDto) {
    return this.woodNamingService.createWoodNaming(woodNamingDto);
  }

  @ApiOperation({ summary: 'Редактирование условного обозначения' })
  @Put('/:woodNamingId')
  update(
    @Param('woodNamingId') woodNamingId: string,
    @Body() woodNamingDto: CreateWoodNamingDto,
  ) {
    return this.woodNamingService.updateWoodNaming(
      Number(woodNamingId),
      woodNamingDto,
    );
  }

  @ApiOperation({ summary: 'Удаление условного обозначения' })
  @Delete('/:woodNamingId')
  delete(@Param('woodNamingId') woodNamingId: string) {
    return this.woodNamingService.deleteWoodNaming(Number(woodNamingId));
  }
}
