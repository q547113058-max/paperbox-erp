import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorLog } from '../entities/error_logs';

@Injectable()
export class ErrorLogService {
  constructor(
    @InjectRepository(ErrorLog)
    private readonly repo: Repository<ErrorLog>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<ErrorLog>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<ErrorLog>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`error_logs ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`error_logs ${id} not found`);
    return this.repo.remove(item);
  }
}
