import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {ColorPrint} from '../entities/color_prints';

@Injectable()
export class ColorPrintsService {
  constructor(
    @InjectRepository(ColorPrint)
    private readonly repo: Repository<ColorPrint>,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<ColorPrint>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<ColorPrint>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`color_prints ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`color_prints ${id} not found`);
    return this.repo.remove(item);
  }
}
