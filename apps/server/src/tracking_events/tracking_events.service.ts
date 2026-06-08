import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackingEvent } from '../entities/tracking_events';

@Injectable()
export class TrackingEventService {
  constructor(
    @InjectRepository(TrackingEvent)
    private readonly repo: Repository<TrackingEvent>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<TrackingEvent>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<TrackingEvent>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`tracking_events ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`tracking_events ${id} not found`);
    return this.repo.remove(item);
  }
}
