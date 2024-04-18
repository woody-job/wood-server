import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { DimensionService } from './dimension.service';
import { CreateDimensionDto } from './dtos/create-dimension.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Сечения')
@Controller('dimension')
export class DimensionController {
  constructor(private dimensionService: DimensionService) {}

  @ApiOperation({
    summary:
      'Создание сечения (уникальное сочетание ширины/толщины/длины/сорта)',
  })
  @Post()
  create(@Body() dimensionDto: CreateDimensionDto) {
    return this.dimensionService.createDimension(dimensionDto);
  }

  @ApiOperation({
    summary: 'Редактирование сечения',
  })
  @Put('/:id')
  update(
    @Param('id') dimensionId: string,
    @Body() dimensionDto: CreateDimensionDto,
  ) {
    return this.dimensionService.updateDimension(
      Number(dimensionId),
      dimensionDto,
    );
  }

  @ApiOperation({
    summary: 'Удаление сечения',
  })
  @Delete('/:id')
  delete(@Param('id') dimensionId: string) {
    return this.dimensionService.deleteDimension(Number(dimensionId));
  }

  @ApiOperation({
    summary: 'Получение списка всех сечений',
  })
  @Get('/list')
  getAll() {
    return this.dimensionService.getAllDimensions();
  }

  @ApiOperation({
    summary: 'Получение списка всех сечений по выбранному сорту',
  })
  @Get('/list/:woodClassId')
  getAllByWoodClass(@Param('woodClassId') woodClassId: string) {
    return this.dimensionService.getDimensionsByWoodClass(Number(woodClassId));
  }
}
