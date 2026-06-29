import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { PersonnelService } from './personnel.service';
import { Personnel } from '../entities/personnel';

@Controller('personnel')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PersonnelController extends CrudController<Personnel> {
  constructor(service: PersonnelService) {
    super(service);
  }
}
