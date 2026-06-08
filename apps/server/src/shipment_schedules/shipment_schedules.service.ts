import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShipmentSchedule } from '../entities/shipment_schedules';

@Injectable()
export class ShipmentScheduleService {
  constructor(
    @InjectRepository(ShipmentSchedule)
    private readonly repo: Repository<ShipmentSchedule>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<ShipmentSchedule>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<ShipmentSchedule>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`shipment_schedules ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`shipment_schedules ${id} not found`);
    return this.repo.remove(item);
  }
}
