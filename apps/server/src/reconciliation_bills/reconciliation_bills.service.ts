import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReconciliationBill } from '../entities/reconciliation_bills';

@Injectable()
export class ReconciliationBillService {
  constructor(
    @InjectRepository(ReconciliationBill)
    private readonly repo: Repository<ReconciliationBill>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<ReconciliationBill>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<ReconciliationBill>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`reconciliation_bills ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`reconciliation_bills ${id} not found`);
    return this.repo.remove(item);
  }
}
