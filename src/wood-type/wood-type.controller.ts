import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WoodTypeService } from './wood-type.service';
import { CreateWoodTypeDto } from './dtos/create-wood-type.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Породы леса')
@Controller('wood-type')
export class WoodTypeController {
  constructor(private woodTypeService: WoodTypeService) {}

  @ApiOperation({ summary: 'Получение списка всех пород' })
  @Roles('SUPERADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  @Get('/list')
  getAll() {
    return this.woodTypeService.getAllWoodTypes();
  }

  @ApiOperation({ summary: 'Создание породы' })
  @Post()
  create(@Body() woodTypeDto: CreateWoodTypeDto) {
    return this.woodTypeService.createWoodType(woodTypeDto);
  }

  @ApiOperation({ summary: 'Удаление породы' })
  @Delete('/:id')
  delete(@Param('id') woodTypeId: string) {
    return this.woodTypeService.deleteWoodType(Number(woodTypeId));
  }
}
