import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { SpecOptionsService } from './spec_options.service';
import { SpecOption } from '../entities/spec_options';

@Controller('spec_options')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SpecOptionsController extends CrudController<SpecOption> {
  constructor(service: SpecOptionsService) {
    super(service);
  }
}
