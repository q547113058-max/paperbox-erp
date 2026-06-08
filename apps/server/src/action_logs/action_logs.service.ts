import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActionLog } from '../entities/action_logs';

@Injectable()
export class ActionLogService {
  constructor(
    @InjectRepository(ActionLog)
    private readonly repo: Repository<ActionLog>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<ActionLog>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<ActionLog>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`action_logs ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`action_logs ${id} not found`);
    return this.repo.remove(item);
  }
}
