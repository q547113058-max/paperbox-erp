import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permissions';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly repo: Repository<Permission>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<Permission>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<Permission>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`permissions ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`permissions ${id} not found`);
    return this.repo.remove(item);
  }
}
