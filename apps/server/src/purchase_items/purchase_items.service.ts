import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseItem } from '../entities/purchase_items';

@Injectable()
export class PurchaseItemService {
  constructor(
    @InjectRepository(PurchaseItem)
    private readonly repo: Repository<PurchaseItem>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<PurchaseItem>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<PurchaseItem>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`purchase_items ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`purchase_items ${id} not found`);
    return this.repo.remove(item);
  }
}
