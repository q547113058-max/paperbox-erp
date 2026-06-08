import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutsourcingEntry } from '../entities/outsourcing_entries';

@Injectable()
export class OutsourcingEntryService {
  constructor(
    @InjectRepository(OutsourcingEntry)
    private readonly repo: Repository<OutsourcingEntry>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<OutsourcingEntry>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<OutsourcingEntry>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`outsourcing_entries ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`outsourcing_entries ${id} not found`);
    return this.repo.remove(item);
  }
}
