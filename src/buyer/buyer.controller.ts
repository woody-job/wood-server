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
import { CreateBuyerDto } from './dtos/create-buyer.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { BuyerService } from './buyer.service';

@ApiTags('Покупатели')
@Controller('buyer')
export class BuyerController {
  constructor(private BuyerService: BuyerService) {}

  @ApiOperation({ summary: 'Получение списка всех покупателей' })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/list')
  getAll() {
    return this.BuyerService.getAllBuyers();
  }

  @ApiOperation({ summary: 'Создание покупателя' })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() buyerDto: CreateBuyerDto) {
    return this.BuyerService.createBuyer(buyerDto);
  }

  @ApiOperation({ summary: 'Обновление покупателя' })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Put('/:buyerId')
  update(@Param('buyerId') buyerId: string, @Body() buyerDto: CreateBuyerDto) {
    return this.BuyerService.updateBuyer(Number(buyerId), buyerDto);
  }

  @ApiOperation({ summary: 'Удаление покупателя' })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Delete(':buyerId')
  delete(@Param('buyerId') buyerId: string) {
    return this.BuyerService.deleteBuyer(Number(buyerId));
  }
}
