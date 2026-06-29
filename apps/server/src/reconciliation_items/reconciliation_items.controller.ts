import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { ReconciliationItemService } from './reconciliation_items.service';
import { ReconciliationItem } from '../entities/reconciliation_items';

@Controller('reconciliation_items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReconciliationItemController extends CrudController<ReconciliationItem> {
  constructor(service: ReconciliationItemService) {
    super(service);
  }
}
