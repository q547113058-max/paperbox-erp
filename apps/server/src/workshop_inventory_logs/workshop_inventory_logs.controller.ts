import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { WorkshopInventoryLogService } from './workshop_inventory_logs.service';
import { WorkshopInventoryLog } from '../entities/workshop_inventory_logs';

@Controller('workshop_inventory_logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkshopInventoryLogController extends CrudController<WorkshopInventoryLog> {
  constructor(service: WorkshopInventoryLogService) {
    super(service);
  }
}
