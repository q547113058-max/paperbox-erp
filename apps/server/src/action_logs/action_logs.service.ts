import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { ActionLog } from '../entities/action_logs';

@Injectable()
export class ActionLogService extends CrudService<ActionLog> {
  constructor(
    @InjectRepository(ActionLog)
    repo: Repository<ActionLog>,
  ) {
    super(repo);
  }
}
