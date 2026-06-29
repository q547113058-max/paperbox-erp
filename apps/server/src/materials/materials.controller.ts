import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { MaterialsService } from './materials.service';
import { Material } from '../entities/materials';

@Controller('materials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialsController extends CrudController<Material> {
  constructor(service: MaterialsService) {
    super(service);
  }
}
