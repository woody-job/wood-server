import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from './roles.model';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role) private roleRepository: typeof Role) {}

  async getAllRoles() {
    const roles = await this.roleRepository.findAll({ include: { all: true } });

    return roles;
  }

  async findRoleById(id: number) {
    const role = await this.roleRepository.findByPk(id);

    return role;
  }
}
