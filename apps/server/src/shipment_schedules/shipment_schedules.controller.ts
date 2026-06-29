import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { ShipmentScheduleService } from './shipment_schedules.service';
import { ShipmentSchedule } from '../entities/shipment_schedules';

@Controller('shipment_schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShipmentScheduleController extends CrudController<ShipmentSchedule> {
  constructor(service: ShipmentScheduleService) {
    super(service);
  }
}
