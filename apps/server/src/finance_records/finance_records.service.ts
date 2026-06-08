import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceRecord } from '../entities/finance_records';

@Injectable()
export class FinanceRecordService {
  constructor(
    @InjectRepository(FinanceRecord)
    private readonly repo: Repository<FinanceRecord>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<FinanceRecord>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<FinanceRecord>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`finance_records ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`finance_records ${id} not found`);
    return this.repo.remove(item);
  }
}
