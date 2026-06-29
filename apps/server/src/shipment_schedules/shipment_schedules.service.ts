import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { ShipmentSchedule } from '../entities/shipment_schedules';

@Injectable()
export class ShipmentScheduleService extends CrudService<ShipmentSchedule> {
  constructor(
    @InjectRepository(ShipmentSchedule)
    repo: Repository<ShipmentSchedule>,
  ) {
    super(repo);
  }
}
