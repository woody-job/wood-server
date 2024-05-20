import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './users.model';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private userRepository: typeof User,
    private rolesService: RolesService,
  ) {}

  async createUser(userDto: CreateUserDto) {
    const { roleId, ...restUserDto } = userDto;

    const user = await this.userRepository.create(restUserDto);
    const role = await this.rolesService.findRoleById(roleId);

    if (!role) {
      throw new HttpException(
        'Выбранная роль не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    await user.$set('role', role.id);
    user.role = role;

    return user;
  }

  async updateUser(id: number, userDto: CreateUserDto) {
    const { login, fullName, password, roleId } = userDto;

    const user = await this.userRepository.findByPk(id);
    const role = await this.rolesService.findRoleById(roleId);

    if (!user) {
      throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
    }

    if (!role) {
      throw new HttpException(
        'Выбранная роль не найдена',
        HttpStatus.NOT_FOUND,
      );
    }

    user.login = login;
    user.fullName = fullName;
    user.password = password;

    if (roleId !== user.roleId) {
      user.$set('role', roleId);
    }

    await user.save();

    return user;
  }

  async deleteUser(userId: number) {
    const user = await this.userRepository.findByPk(userId);

    if (!user) {
      throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
    }

    await user.destroy();
  }

  async getAllUsers() {
    const users = await this.userRepository.findAll({ include: { all: true } }); // TODO: Разобраться с отправкой хешированного пароля

    return users;
  }

  async getUserByLogin(login: string) {
    const user = await this.userRepository.findOne({
      where: { login },
      include: { all: true },
    });

    return user;
  }

  async getUserById(userId: number) {
    const user = await this.userRepository.findByPk(userId);

    return user;
  }
}
