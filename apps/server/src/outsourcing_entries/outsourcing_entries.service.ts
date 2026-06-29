import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { OutsourcingEntry } from '../entities/outsourcing_entries';

@Injectable()
export class OutsourcingEntryService extends CrudService<OutsourcingEntry> {
  constructor(
    @InjectRepository(OutsourcingEntry)
    repo: Repository<OutsourcingEntry>,
  ) {
    super(repo);
  }
}
