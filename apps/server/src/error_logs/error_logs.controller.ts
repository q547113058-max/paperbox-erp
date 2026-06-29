import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { ErrorLogService } from './error_logs.service';
import { ErrorLog } from '../entities/error_logs';

@Controller('error_logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ErrorLogController extends CrudController<ErrorLog> {
  constructor(service: ErrorLogService) {
    super(service);
  }
}
