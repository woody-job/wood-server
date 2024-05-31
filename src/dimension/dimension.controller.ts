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
import { DimensionService } from './dimension.service';
import { CreateDimensionDto } from './dtos/create-dimension.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Сечения')
@Controller('dimension')
export class DimensionController {
  constructor(private dimensionService: DimensionService) {}

  @ApiOperation({
    summary:
      'Создание сечения (уникальное сочетание ширины/толщины/длины/сорта)',
  })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() dimensionDto: CreateDimensionDto) {
    return this.dimensionService.createDimension(dimensionDto);
  }

  // TODO: RUN THIS ONCE
  @Get('fix')
  fix() {
    return this.dimensionService.fixDimensions();
  }

  @ApiOperation({
    summary: 'Редактирование сечения',
  })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
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
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Delete('/:id')
  delete(@Param('id') dimensionId: string) {
    return this.dimensionService.deleteDimension(Number(dimensionId));
  }

  @ApiOperation({
    summary: 'Получение списка всех сечений',
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/list')
  getAll() {
    return this.dimensionService.getAllDimensions();
  }

  @ApiOperation({
    summary: 'Получение списка всех сечений по выбранному сорту',
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/list/:woodClassId')
  getAllByWoodClass(@Param('woodClassId') woodClassId: string) {
    return this.dimensionService.getDimensionsByWoodClass(Number(woodClassId));
  }
}
