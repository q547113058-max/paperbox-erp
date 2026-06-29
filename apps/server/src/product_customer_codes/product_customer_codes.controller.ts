import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { ProductCustomerCodeService } from './product_customer_codes.service';
import { ProductCustomerCode } from '../entities/product_customer_codes';

@Controller('product_customer_codes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductCustomerCodeController extends CrudController<ProductCustomerCode> {
  constructor(service: ProductCustomerCodeService) {
    super(service);
  }
}
