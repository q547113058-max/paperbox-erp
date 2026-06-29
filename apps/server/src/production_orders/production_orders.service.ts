import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { ProductionOrder } from '../entities/production_orders';

@Injectable()
export class ProductionOrdersService extends CrudService<ProductionOrder> {
  constructor(
    @InjectRepository(ProductionOrder)
    repo: Repository<ProductionOrder>,
  ) {
    super(repo);
  }
}
