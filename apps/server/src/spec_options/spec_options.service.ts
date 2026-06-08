import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {SpecOption} from '../entities/spec_options';

@Injectable()
export class SpecOptionsService {
  constructor(
    @InjectRepository(SpecOption)
    private readonly repo: Repository<SpecOption>,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<SpecOption>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<SpecOption>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`spec_options ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`spec_options ${id} not found`);
    return this.repo.remove(item);
  }
}
