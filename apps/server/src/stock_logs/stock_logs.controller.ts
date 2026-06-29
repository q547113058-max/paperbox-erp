import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { StockLogService } from './stock_logs.service';
import { StockLog } from '../entities/stock_logs';

@Controller('stock_logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockLogController extends CrudController<StockLog> {
  constructor(service: StockLogService) {
    super(service);
  }
}
