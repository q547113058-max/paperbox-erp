import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {WorkOrder} from '../entities/work_orders';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly repo: Repository<WorkOrder>,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<WorkOrder>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<WorkOrder>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`work_orders ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`work_orders ${id} not found`);
    return this.repo.remove(item);
  }
}
