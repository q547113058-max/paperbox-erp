import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { Personnel } from '../entities/personnel';

@Injectable()
export class PersonnelService extends CrudService<Personnel> {
  constructor(
    @InjectRepository(Personnel)
    repo: Repository<Personnel>,
  ) {
    super(repo);
  }
}
