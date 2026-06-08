import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrintItem } from '../entities/print_items';

@Injectable()
export class PrintItemService {
  constructor(
    @InjectRepository(PrintItem)
    private readonly repo: Repository<PrintItem>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<PrintItem>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<PrintItem>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`print_items ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`print_items ${id} not found`);
    return this.repo.remove(item);
  }
}
