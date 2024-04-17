import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dtos/create-role.dto';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Роли пользователей')
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @ApiOperation({ summary: 'Получение списка всех ролей' })
  @Get('/list')
  getAll() {
    return this.rolesService.getAllRoles();
  }

  @ApiOperation({ summary: 'Создание роли (только для суперадмина)' })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() roleDto: CreateRoleDto) {
    return this.rolesService.createRole(roleDto);
  }

  @ApiOperation({ summary: 'Удаление роли (только для суперадмина)' })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Delete('/:id')
  delete(@Param('id') roleId: string) {
    return this.rolesService.deleteRole(Number(roleId));
  }
}
