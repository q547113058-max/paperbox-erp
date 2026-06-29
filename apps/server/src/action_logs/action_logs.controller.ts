import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { ActionLogService } from './action_logs.service';
import { ActionLog } from '../entities/action_logs';

@Controller('action_logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActionLogController extends CrudController<ActionLog> {
  constructor(service: ActionLogService) {
    super(service);
  }
}
