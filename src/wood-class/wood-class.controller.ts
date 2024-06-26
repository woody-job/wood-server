import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WoodClassService } from './wood-class.service';
import { CreateWoodClassDto } from './dtos/create-wood-class.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Сорта доски')
@Controller('wood-class')
export class WoodClassController {
  constructor(private woodClassService: WoodClassService) {}

  @ApiOperation({ summary: 'Получение списка всех сортов' })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/list')
  getAll() {
    return this.woodClassService.getAllWoodClasses();
  }

  @ApiOperation({ summary: 'Создание сорта доски' })
  @Post()
  create(@Body() woodClassDto: CreateWoodClassDto) {
    return this.woodClassService.createWoodClass(woodClassDto);
  }

  @ApiOperation({ summary: 'Удаление сорта доски' })
  @Delete('/:id')
  delete(@Param('id') woodClassId: string) {
    return this.woodClassService.deleteWoodClass(Number(woodClassId));
  }
}
