import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { SettingsService } from './settings.service';
import { Setting } from '../entities/settings';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController extends CrudController<Setting> {
  constructor(service: SettingsService) {
    super(service);
  }
}
