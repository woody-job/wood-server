import { Body, Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { AuthService } from './auth.service';
import { LoginUserDto } from 'src/users/dtos/login-user-dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from './roles-auth.decorator';
import { RolesGuard } from './roles.guard';

@ApiTags('Авторизация/регистрация')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Получение jwt токена (только access), вход' })
  @Post('/login')
  login(@Body() userDto: LoginUserDto) {
    return this.authService.login(userDto);
  }

  @ApiOperation({
    summary:
      'Создание пользователя и получение jwt токена (только access), вход',
  })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Post('/register')
  register(@Body() userDto: CreateUserDto) {
    return this.authService.register(userDto);
  }

  @ApiOperation({
    summary: 'Редактирование пользователя с хешерованием нового пароля',
  })
  @Roles('SUPERADMIN')
  @UseGuards(RolesGuard)
  @Put('/edit-user/:userId')
  updateUser(@Param('userId') userId: string, @Body() userDto: CreateUserDto) {
    return this.authService.updateUser(Number(userId), userDto);
  }
}
