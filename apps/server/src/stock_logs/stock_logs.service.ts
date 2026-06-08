import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockLog } from '../entities/stock_logs';

@Injectable()
export class StockLogService {
  constructor(
    @InjectRepository(StockLog)
    private readonly repo: Repository<StockLog>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<StockLog>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<StockLog>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`stock_logs ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`stock_logs ${id} not found`);
    return this.repo.remove(item);
  }
}
