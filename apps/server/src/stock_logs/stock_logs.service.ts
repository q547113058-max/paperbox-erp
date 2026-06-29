import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { StockLog } from '../entities/stock_logs';

@Injectable()
export class StockLogService extends CrudService<StockLog> {
  constructor(
    @InjectRepository(StockLog)
    repo: Repository<StockLog>,
  ) {
    super(repo);
  }
}
