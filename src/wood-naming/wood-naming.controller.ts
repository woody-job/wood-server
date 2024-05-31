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
import { WoodNamingService } from './wood-naming.service';
import { CreateWoodNamingDto } from './dtos/create-wood-naming.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Условные обозначения леса')
@Controller('wood-naming')
export class WoodNamingController {
  constructor(private woodNamingService: WoodNamingService) {}

  @ApiOperation({ summary: 'Получение списка всех условных обозначений' })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/list')
  getAll() {
    return this.woodNamingService.getAllWoodNamings();
  }

  @ApiOperation({ summary: 'Создание условного обозначения' })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() woodNamingDto: CreateWoodNamingDto) {
    return this.woodNamingService.createWoodNaming(woodNamingDto);
  }

  @ApiOperation({ summary: 'Редактирование условного обозначения' })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
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
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Delete('/:woodNamingId')
  delete(@Param('woodNamingId') woodNamingId: string) {
    return this.woodNamingService.deleteWoodNaming(Number(woodNamingId));
  }
}
