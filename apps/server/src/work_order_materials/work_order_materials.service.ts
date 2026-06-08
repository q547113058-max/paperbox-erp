import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrderMaterial } from '../entities/work_order_materials';

@Injectable()
export class WorkOrderMaterialService {
  constructor(
    @InjectRepository(WorkOrderMaterial)
    private readonly repo: Repository<WorkOrderMaterial>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<WorkOrderMaterial>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<WorkOrderMaterial>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`work_order_materials ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`work_order_materials ${id} not found`);
    return this.repo.remove(item);
  }
}
