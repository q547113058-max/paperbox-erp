import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

export class CrudService<T = any> {
  protected defaultOrder: Record<string, 'ASC' | 'DESC'> = { id: 'DESC' };

  constructor(protected readonly repo: Repository<any>) {}

  findAll() {
    return this.repo.find({ order: this.defaultOrder as any });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } as any });
  }

  create(data: any) {
    const item = this.repo.create(data);
    return this.repo.save(item as any);
  }

  async update(id: number, data: any) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`Record ${id} not found`);
    Object.assign(item as any, data);
    return this.repo.save(item as any);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`Record ${id} not found`);
    return this.repo.remove(item as any);
  }
}
