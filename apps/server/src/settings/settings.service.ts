import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { Setting } from '../entities/settings';

@Injectable()
export class SettingsService extends CrudService<Setting> {
  constructor(
    @InjectRepository(Setting)
    repo: Repository<Setting>,
  ) {
    super(repo);
  }
}
