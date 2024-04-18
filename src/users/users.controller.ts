import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from './users.model';

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
  @Delete('/:id')
  delete(@Param('id') id: string) {
    return this.usersService.deleteUser(Number(id));
  }

  @ApiOperation({ summary: 'Получение списка всех пользователей' })
  @ApiResponse({ status: 200, type: [User] })
  @Get('/list')
  getAll() {
    return this.usersService.getAllUsers();
  }
}
