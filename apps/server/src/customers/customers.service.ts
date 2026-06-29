import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { Customer } from '../entities/customers';

@Injectable()
export class CustomersService extends CrudService<Customer> {
  protected defaultOrder = { name: 'ASC' as const };

  constructor(
    @InjectRepository(Customer)
    repo: Repository<Customer>,
  ) {
    super(repo);
  }
}
