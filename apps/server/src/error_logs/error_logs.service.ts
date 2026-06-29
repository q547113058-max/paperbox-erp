import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { ErrorLog } from '../entities/error_logs';

@Injectable()
export class ErrorLogService extends CrudService<ErrorLog> {
  constructor(
    @InjectRepository(ErrorLog)
    repo: Repository<ErrorLog>,
  ) {
    super(repo);
  }
}
