import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrintItemImage } from '../entities/print_item_images';

@Injectable()
export class PrintItemImageService {
  constructor(
    @InjectRepository(PrintItemImage)
    private readonly repo: Repository<PrintItemImage>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<PrintItemImage>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<PrintItemImage>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`print_item_images ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`print_item_images ${id} not found`);
    return this.repo.remove(item);
  }
}
