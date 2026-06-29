import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { PrintItemService } from './print_items.service';
import { PrintItem } from '../entities/print_items';

@Controller('print_items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrintItemController extends CrudController<PrintItem> {
  constructor(service: PrintItemService) {
    super(service);
  }
}
