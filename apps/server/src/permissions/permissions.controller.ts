import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { PermissionService } from './permissions.service';
import { Permission } from '../entities/permissions';

@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionController extends CrudController<Permission> {
  constructor(service: PermissionService) {
    super(service);
  }
}
