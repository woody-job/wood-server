import { Controller, Get } from '@nestjs/common';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get('/list')
  getAll() {
    return this.rolesService.getAllRoles();
  }
}
