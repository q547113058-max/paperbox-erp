import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {WarehouseEntry} from '../entities/warehouse_entries';

@Injectable()
export class WarehouseEntriesService {
  constructor(
    @InjectRepository(WarehouseEntry)
    private readonly repo: Repository<WarehouseEntry>,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<WarehouseEntry>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<WarehouseEntry>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`warehouse_entries ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`warehouse_entries ${id} not found`);
    return this.repo.remove(item);
  }
}
