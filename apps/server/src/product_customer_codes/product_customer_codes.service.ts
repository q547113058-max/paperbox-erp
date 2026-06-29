import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { ProductCustomerCode } from '../entities/product_customer_codes';

@Injectable()
export class ProductCustomerCodeService extends CrudService<ProductCustomerCode> {
  constructor(
    @InjectRepository(ProductCustomerCode)
    repo: Repository<ProductCustomerCode>,
  ) {
    super(repo);
  }
}
