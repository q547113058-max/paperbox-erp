import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../entities/suppliers';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly repo: Repository<Supplier>,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Supplier>) {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }

  async update(id: number, data: Partial<Supplier>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`Supplier ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`Supplier ${id} not found`);
    return this.repo.remove(item);
  }
}
