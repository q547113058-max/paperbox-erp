import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { PurchaseItemService } from './purchase_items.service';
import { PurchaseItem } from '../entities/purchase_items';

@Controller('purchase_items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchaseItemController extends CrudController<PurchaseItem> {
  constructor(service: PurchaseItemService) {
    super(service);
  }
}
