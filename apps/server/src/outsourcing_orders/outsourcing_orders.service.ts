import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutsourcingOrder } from '../entities/outsourcing_orders';

@Injectable()
export class OutsourcingOrderService {
  constructor(
    @InjectRepository(OutsourcingOrder)
    private readonly repo: Repository<OutsourcingOrder>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<OutsourcingOrder>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<OutsourcingOrder>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`outsourcing_orders ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`outsourcing_orders ${id} not found`);
    return this.repo.remove(item);
  }
}
