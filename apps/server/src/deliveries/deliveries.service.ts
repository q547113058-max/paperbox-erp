import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {Delivery} from '../entities/deliveries';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private readonly repo: Repository<Delivery>,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Delivery>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Delivery>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`deliveries ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`deliveries ${id} not found`);
    return this.repo.remove(item);
  }
}
