import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReconciliationItem } from '../entities/reconciliation_items';

@Injectable()
export class ReconciliationItemService {
  constructor(
    @InjectRepository(ReconciliationItem)
    private readonly repo: Repository<ReconciliationItem>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<ReconciliationItem>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<ReconciliationItem>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`reconciliation_items ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`reconciliation_items ${id} not found`);
    return this.repo.remove(item);
  }
}
