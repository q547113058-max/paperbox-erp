import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {Personnel} from '../entities/personnel';

@Injectable()
export class PersonnelService {
  constructor(
    @InjectRepository(Personnel)
    private readonly repo: Repository<Personnel>,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Personnel>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Personnel>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`personnel ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`personnel ${id} not found`);
    return this.repo.remove(item);
  }
}
