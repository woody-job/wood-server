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

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  create(@Body() userDto: CreateUserDto) {
    return this.usersService.createUser(userDto);
  }

  @Put('/:id')
  update(@Param('id') id: string, @Body() userDto: CreateUserDto) {
    return this.usersService.updateUser(Number(id), userDto);
  }

  @Delete('/:id')
  delete(@Param('id') id: string) {
    return this.usersService.deleteUser(Number(id));
  }

  @Get('/list')
  getAll() {
    return this.usersService.getAllUsers();
  }
}
