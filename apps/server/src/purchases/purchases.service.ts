import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {Purchase} from '../entities/purchases';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private readonly repo: Repository<Purchase>,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Purchase>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Purchase>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`purchases ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`purchases ${id} not found`);
    return this.repo.remove(item);
  }
}
