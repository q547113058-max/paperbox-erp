import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { Permission } from '../entities/permissions';

@Injectable()
export class PermissionService extends CrudService<Permission> {
  constructor(
    @InjectRepository(Permission)
    repo: Repository<Permission>,
  ) {
    super(repo);
  }
}
