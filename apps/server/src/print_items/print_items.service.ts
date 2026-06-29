import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { PrintItem } from '../entities/print_items';

@Injectable()
export class PrintItemService extends CrudService<PrintItem> {
  constructor(
    @InjectRepository(PrintItem)
    repo: Repository<PrintItem>,
  ) {
    super(repo);
  }
}
