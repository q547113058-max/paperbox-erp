import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {KnifeDie} from '../entities/knife_dies';

@Injectable()
export class KnifeDiesService {
  constructor(
    @InjectRepository(KnifeDie)
    private readonly repo: Repository<KnifeDie>,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<KnifeDie>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<KnifeDie>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`knife_dies ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`knife_dies ${id} not found`);
    return this.repo.remove(item);
  }
}
