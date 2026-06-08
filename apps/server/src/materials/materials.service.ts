import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {Material} from '../entities/materials';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private readonly repo: Repository<Material>,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Material>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Material>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`materials ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`materials ${id} not found`);
    return this.repo.remove(item);
  }
}
