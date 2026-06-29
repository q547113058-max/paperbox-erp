import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { WorkOrderMaterial } from '../entities/work_order_materials';

@Injectable()
export class WorkOrderMaterialService extends CrudService<WorkOrderMaterial> {
  constructor(
    @InjectRepository(WorkOrderMaterial)
    repo: Repository<WorkOrderMaterial>,
  ) {
    super(repo);
  }
}
