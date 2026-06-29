import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { WorkshopInventoryLog } from '../entities/workshop_inventory_logs';

@Injectable()
export class WorkshopInventoryLogService extends CrudService<WorkshopInventoryLog> {
  constructor(
    @InjectRepository(WorkshopInventoryLog)
    repo: Repository<WorkshopInventoryLog>,
  ) {
    super(repo);
  }
}
