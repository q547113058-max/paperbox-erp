import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { PurchaseItem } from '../entities/purchase_items';

@Injectable()
export class PurchaseItemService extends CrudService<PurchaseItem> {
  constructor(
    @InjectRepository(PurchaseItem)
    repo: Repository<PurchaseItem>,
  ) {
    super(repo);
  }
}
