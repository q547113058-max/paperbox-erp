import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { WorkOrderMaterialService } from './work_order_materials.service';
import { WorkOrderMaterial } from '../entities/work_order_materials';

@Controller('work_order_materials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkOrderMaterialController extends CrudController<WorkOrderMaterial> {
  constructor(service: WorkOrderMaterialService) {
    super(service);
  }
}
