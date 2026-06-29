import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { CustomersService } from './customers.service';
import { Customer } from '../entities/customers';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController extends CrudController<Customer> {
  constructor(service: CustomersService) {
    super(service);
  }
}
