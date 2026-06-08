import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrdersController } from './work_orders.controller';
import { WorkOrdersService } from './work_orders.service';
import {WorkOrder} from '../entities/work_orders';

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrder])],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
