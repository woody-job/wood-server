import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WorkshopWoodPricesService } from './workshop-wood-prices.service';
import { CreateWorkshopWoodPriceDto } from './dtos/create-workshop-wood-price.dto';
import { UpdateWorkshopWoodPriceDto } from './dtos/update-workshop-wood-price.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Цены доски для цехов')
@Controller('workshop-wood-prices')
export class WorkshopWoodPricesController {
  constructor(private workshopWoodPricesService: WorkshopWoodPricesService) {}

  @ApiOperation({
    summary:
      'Создание цены доски для цеха (уникальное сочетание сечения и сорта)',
  })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() workshopWoodPriceDto: CreateWorkshopWoodPriceDto) {
    return this.workshopWoodPricesService.createWorkshopWoodPrice(
      workshopWoodPriceDto,
    );
  }

  @ApiOperation({
    summary: 'Обновление цены доски для цеха',
  })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Put('/:workshopWoodPriceId')
  update(
    @Param('workshopWoodPriceId') workshopWoodPriceId: string,
    @Body() workshopWoodPriceDto: UpdateWorkshopWoodPriceDto,
  ) {
    return this.workshopWoodPricesService.updateWorkshopWoodPrice(
      Number(workshopWoodPriceId),
      workshopWoodPriceDto,
    );
  }

  @ApiOperation({
    summary:
      'Получение списка цен доски для выбранного цеха + фильтрация по сорту',
  })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('list/:workshopId')
  getAllByWorkshopId(
    @Param('workshopId') workshopId: string,
    @Query('woodClassId') woodClassId: string | undefined,
  ) {
    return this.workshopWoodPricesService.getAllWorkshopWoodPricesByWorkshopId(
      Number(workshopId),
      woodClassId ? Number(woodClassId) : undefined,
    );
  }

  @Delete('/:workshopWoodPriceId')
  delete(@Param('workshopWoodPriceId') workshopWoodPriceId: string) {
    return this.workshopWoodPricesService.deleteWorkshopWoodPrice(
      Number(workshopWoodPriceId),
    );
  }
}
