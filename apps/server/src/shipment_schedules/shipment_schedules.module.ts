import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipmentScheduleController } from './shipment_schedules.controller';
import { ShipmentScheduleService } from './shipment_schedules.service';
import { ShipmentSchedule } from '../entities/shipment_schedules';

@Module({
  imports: [TypeOrmModule.forFeature([ShipmentSchedule])],
  controllers: [ShipmentScheduleController],
  providers: [ShipmentScheduleService],
  exports: [ShipmentScheduleService],
})
export class ShipmentScheduleModule {}
