import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { SuppliersService } from './suppliers.service';
import { Supplier } from '../entities/suppliers';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController extends CrudController<Supplier> {
  constructor(service: SuppliersService) {
    super(service);
  }
}
