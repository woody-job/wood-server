import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { DataManagementService } from './data-management.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Управление данными')
@Controller('data-management')
export class DataManagementController {
  constructor(private dataManagementService: DataManagementService) {}

  @ApiOperation({
    summary:
      'Создание базовых сущностей при инициализации приложения. Работает только с пустой базой',
  })
  @Get('/create-base-entities')
  createBaseEntities() {
    return this.dataManagementService.createBaseEntities();
  }

  @ApiOperation({
    summary: 'Обновление размеров леса. Переход на длину + объем по ГОСТу',
  })
  @Get('/update-beam-sizes')
  updateBeamSizes() {
    return this.dataManagementService.updateBeamSizes();
  }

  @ApiOperation({
    summary:
      'Удаление всех записей о работе предприятия (вход, выход, ежедневные данные цехов, поступления, отгрузки, склад, сушилки)',
  })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Delete('/delete-user-created-data')
  deleteData() {
    return this.dataManagementService.deleteUserCreatedData();
  }
}
