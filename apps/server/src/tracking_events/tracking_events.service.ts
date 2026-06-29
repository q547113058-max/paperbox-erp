import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { TrackingEvent } from '../entities/tracking_events';

@Injectable()
export class TrackingEventService extends CrudService<TrackingEvent> {
  constructor(
    @InjectRepository(TrackingEvent)
    repo: Repository<TrackingEvent>,
  ) {
    super(repo);
  }
}
