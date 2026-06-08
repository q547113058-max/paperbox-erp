import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customers';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Customer>) {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }

  async update(id: number, data: Partial<Customer>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`Customer ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`Customer ${id} not found`);
    return this.repo.remove(item);
  }
}
