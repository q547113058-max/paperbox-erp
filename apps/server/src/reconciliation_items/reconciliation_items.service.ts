import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { ReconciliationItem } from '../entities/reconciliation_items';

@Injectable()
export class ReconciliationItemService extends CrudService<ReconciliationItem> {
  constructor(
    @InjectRepository(ReconciliationItem)
    repo: Repository<ReconciliationItem>,
  ) {
    super(repo);
  }
}
