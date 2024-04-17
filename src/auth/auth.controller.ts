import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { AuthService } from './auth.service';
import { LoginUserDto } from 'src/users/dtos/login-user-dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

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
  @Post('/register')
  register(@Body() userDto: CreateUserDto) {
    return this.authService.register(userDto);
  }
}
