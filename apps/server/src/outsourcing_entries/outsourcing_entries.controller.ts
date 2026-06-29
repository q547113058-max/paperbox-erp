import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { OutsourcingEntryService } from './outsourcing_entries.service';
import { OutsourcingEntry } from '../entities/outsourcing_entries';

@Controller('outsourcing_entries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OutsourcingEntryController extends CrudController<OutsourcingEntry> {
  constructor(service: OutsourcingEntryService) {
    super(service);
  }
}
