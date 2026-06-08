import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceFixedItem } from '../entities/finance_fixed_items';

@Injectable()
export class FinanceFixedItemService {
  constructor(
    @InjectRepository(FinanceFixedItem)
    private readonly repo: Repository<FinanceFixedItem>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<FinanceFixedItem>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<FinanceFixedItem>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`finance_fixed_items ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`finance_fixed_items ${id} not found`);
    return this.repo.remove(item);
  }
}
