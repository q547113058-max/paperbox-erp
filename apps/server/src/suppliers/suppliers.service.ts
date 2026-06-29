import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { Supplier } from '../entities/suppliers';

@Injectable()
export class SuppliersService extends CrudService<Supplier> {
  protected defaultOrder = { name: 'ASC' as const };

  constructor(
    @InjectRepository(Supplier)
    repo: Repository<Supplier>,
  ) {
    super(repo);
  }
}
