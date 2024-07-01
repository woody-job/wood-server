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
import { CreatePersonInChargeDto } from './dtos/create-person-in-charge.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { PersonInChargeService } from './person-in-charge.service';

@ApiTags('Покупатели')
@Controller('person-in-charge')
export class PersonInChargeController {
  constructor(private personInChargeService: PersonInChargeService) {}

  @ApiOperation({ summary: 'Получение списка всех ответственных' })
  @Roles('SUPERADMIN', 'ADMIN', 'USER')
  @UseGuards(RolesGuard)
  @Get('/list')
  getAll() {
    return this.personInChargeService.getAllPersonsInCharge();
  }

  @ApiOperation({ summary: 'Создание ответственного' })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() personInChargeDto: CreatePersonInChargeDto) {
    return this.personInChargeService.createPersonInCharge(personInChargeDto);
  }

  @ApiOperation({ summary: 'Обновление ответственного' })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Put('/:personInChargeId')
  update(
    @Param('personInChargeId') personInChargeId: string,
    @Body() personInChargeDto: CreatePersonInChargeDto,
  ) {
    return this.personInChargeService.updatePersonInCharge(
      Number(personInChargeId),
      personInChargeDto,
    );
  }

  @ApiOperation({ summary: 'Удаление ответственного' })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Delete(':personInChargeId')
  delete(@Param('personInChargeId') personInChargeId: string) {
    return this.personInChargeService.deletePersonInCharge(
      Number(personInChargeId),
    );
  }
}
