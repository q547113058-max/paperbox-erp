import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { TrackingEventService } from './tracking_events.service';
import { TrackingEvent } from '../entities/tracking_events';

@Controller('tracking_events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrackingEventController extends CrudController<TrackingEvent> {
  constructor(service: TrackingEventService) {
    super(service);
  }
}
