import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkshopInventoryLog } from '../entities/workshop_inventory_logs';

@Injectable()
export class WorkshopInventoryLogService {
  constructor(
    @InjectRepository(WorkshopInventoryLog)
    private readonly repo: Repository<WorkshopInventoryLog>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<WorkshopInventoryLog>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<WorkshopInventoryLog>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`workshop_inventory_logs ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`workshop_inventory_logs ${id} not found`);
    return this.repo.remove(item);
  }
}
