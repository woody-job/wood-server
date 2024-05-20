import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { User } from 'src/users/users.model';
import { UsersService } from 'src/users/users.service';

import * as bcrypt from 'bcryptjs';
import { LoginUserDto } from 'src/users/dtos/login-user-dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(userDto: LoginUserDto) {
    const user = await this.validateUser(userDto);

    return this.generateToken(user);
  }

  async register(userDto: CreateUserDto) {
    const existentUser = await this.userService.getUserByLogin(userDto.login);

    if (existentUser) {
      throw new HttpException(
        'Пользователь с таким логином существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashPassword = await bcrypt.hash(userDto.password, 5);
    const user = await this.userService.createUser({
      ...userDto,
      password: hashPassword,
    });

    return this.generateToken(user);
  }

  async updateUser(userId: number, userDto: CreateUserDto) {
    const existentUser = await this.userService.getUserById(userId);

    if (!existentUser) {
      throw new HttpException(
        'Пользователя не существует',
        HttpStatus.NOT_FOUND,
      );
    }

    const hashPassword = await bcrypt.hash(userDto.password, 5);
    const userDtoForEdit = { ...userDto, password: hashPassword };

    return this.userService.updateUser(userId, userDtoForEdit);
  }

  private async generateToken(user: User) {
    const payload = {
      login: user.login,
      id: user.id,
      fullName: user.fullName,
      role: user.role,
    };

    return {
      token: this.jwtService.sign(payload),
    };
  }

  private async validateUser(userDto: LoginUserDto) {
    const user = await this.userService.getUserByLogin(userDto.login);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Пользователя с таким логином не существует',
      });
    }

    const passwordEquals = await bcrypt.compare(
      userDto.password,
      user.password,
    );

    if (passwordEquals) {
      return user;
    }

    throw new UnauthorizedException({
      message: 'Некорректный пароль',
    });
  }
}
