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
import { WorkshopService } from './workshop.service';
import { CreateWorkshopDto } from './dtos/create-workshop.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Цеха')
@Controller('workshop')
export class WorkshopController {
  constructor(private workshopService: WorkshopService) {}

  @ApiOperation({
    summary: 'Создание цеха',
  })
  @Post()
  create(@Body() workshopDto: CreateWorkshopDto) {
    return this.workshopService.createWorkshop(workshopDto);
  }

  @ApiOperation({
    summary: 'Редактирование данных цеха (цены распиловки и сырья)',
  })
  @Put('/:workshopId')
  update(
    @Param('workshopId') workshopId: string,
    @Body() workshopDto: CreateWorkshopDto,
  ) {
    return this.workshopService.updateWorkshop(Number(workshopId), workshopDto);
  }

  @ApiOperation({
    summary: 'Получение списка всех цехов',
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/list')
  getAll() {
    return this.workshopService.getAllWorkshops();
  }

  @ApiOperation({
    summary: 'Удаление цеха',
  })
  @Delete('/:workshopId')
  delete(@Param('workshopId') workshopId: string) {
    return this.workshopService.deleteWorkshop(Number(workshopId));
  }
}
