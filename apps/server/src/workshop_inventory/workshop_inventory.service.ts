import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkshopInventory } from '../entities/workshop_inventory';

@Injectable()
export class WorkshopInventoryService {
  constructor(
    @InjectRepository(WorkshopInventory)
    private readonly repo: Repository<WorkshopInventory>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<WorkshopInventory>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<WorkshopInventory>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`workshop_inventory ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`workshop_inventory ${id} not found`);
    return this.repo.remove(item);
  }
}
