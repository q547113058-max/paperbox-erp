import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { ProductionOrdersService } from './production_orders.service';
import { ProductionOrder } from '../entities/production_orders';

@Controller('production_orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductionOrdersController extends CrudController<ProductionOrder> {
  constructor(service: ProductionOrdersService) {
    super(service);
  }
}
