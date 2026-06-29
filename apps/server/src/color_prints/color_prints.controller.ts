import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { ColorPrintsService } from './color_prints.service';
import { ColorPrint } from '../entities/color_prints';

@Controller('color_prints')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ColorPrintsController extends CrudController<ColorPrint> {
  constructor(service: ColorPrintsService) {
    super(service);
  }
}
