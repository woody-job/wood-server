import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from './roles.model';
import { CreateRoleDto } from './dtos/create-role.dto';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role) private roleRepository: typeof Role) {}

  async createRole(roleDto: CreateRoleDto) {
    const existingRole = await this.roleRepository.findOne({
      where: { name: roleDto.name },
    });

    if (existingRole) {
      throw new HttpException(
        'Роль с таким названием уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const role = this.roleRepository.create(roleDto);

    return role;
  }

  async getAllRoles() {
    const roles = await this.roleRepository.findAll();

    return roles;
  }

  async findRoleById(roleId: number) {
    const role = await this.roleRepository.findByPk(roleId);

    return role;
  }

  async deleteRole(roleId: number) {
    const role = await this.roleRepository.findByPk(roleId);

    if (!role) {
      throw new HttpException('Роль не найдена', HttpStatus.NOT_FOUND);
    }

    await role.destroy();
  }
}
