import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {Setting} from '../entities/settings';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly repo: Repository<Setting>,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Setting>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Setting>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`settings ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`settings ${id} not found`);
    return this.repo.remove(item);
  }
}
