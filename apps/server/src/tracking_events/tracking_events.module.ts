import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingEventController } from './tracking_events.controller';
import { TrackingEventService } from './tracking_events.service';
import { TrackingEvent } from '../entities/tracking_events';

@Module({
  imports: [TypeOrmModule.forFeature([TrackingEvent])],
  controllers: [TrackingEventController],
  providers: [TrackingEventService],
  exports: [TrackingEventService],
})
export class TrackingEventModule {}
