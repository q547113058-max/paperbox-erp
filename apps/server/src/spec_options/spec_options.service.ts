import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { SpecOption } from '../entities/spec_options';

@Injectable()
export class SpecOptionsService extends CrudService<SpecOption> {
  constructor(
    @InjectRepository(SpecOption)
    repo: Repository<SpecOption>,
  ) {
    super(repo);
  }
}
