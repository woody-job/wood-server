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
import { CreateUserDto } from './dtos/create-user.dto';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from './users.model';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Пользователи')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Создание пользователя' })
  @ApiResponse({ status: 201, type: User })
  @Post()
  create(@Body() userDto: CreateUserDto) {
    return this.usersService.createUser(userDto);
  }

  @ApiOperation({ summary: 'Редактирование пользователя' })
  @ApiResponse({ status: 200, type: User })
  @Put('/:id')
  update(@Param('id') id: string, @Body() userDto: CreateUserDto) {
    return this.usersService.updateUser(Number(id), userDto);
  }

  @ApiOperation({ summary: 'Удаление пользователя' })
  @ApiResponse({ status: 200 })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Delete('/:id')
  delete(@Param('id') id: string) {
    return this.usersService.deleteUser(Number(id));
  }

  @ApiOperation({ summary: 'Получение списка всех пользователей' })
  @ApiResponse({ status: 200, type: [User] })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Get('/list')
  getAll() {
    return this.usersService.getAllUsers();
  }
}
