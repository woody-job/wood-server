import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { WorkshopWoodPricesService } from './workshop-wood-prices.service';
import { CreateWorkshopWoodPriceDto } from './dtos/create-workshop-wood-price.dto';
import { UpdateWorkshopWoodPriceDto } from './dtos/update-workshop-wood-price.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Цены доски для цехов')
@Controller('workshop-wood-prices')
export class WorkshopWoodPricesController {
  constructor(private workshopWoodPricesService: WorkshopWoodPricesService) {}

  @ApiOperation({
    summary:
      'Создание цены доски для цеха (уникальное сочетание сечения и сорта)',
  })
  @Post()
  create(@Body() workshopWoodPriceDto: CreateWorkshopWoodPriceDto) {
    return this.workshopWoodPricesService.createWorkshopWoodPrice(
      workshopWoodPriceDto,
    );
  }

  @ApiOperation({
    summary: 'Обновление цены доски для цеха',
  })
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
}
