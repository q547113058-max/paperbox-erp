import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkshopInventoryLogController } from './workshop_inventory_logs.controller';
import { WorkshopInventoryLogService } from './workshop_inventory_logs.service';
import { WorkshopInventoryLog } from '../entities/workshop_inventory_logs';

@Module({
  imports: [TypeOrmModule.forFeature([WorkshopInventoryLog])],
  controllers: [WorkshopInventoryLogController],
  providers: [WorkshopInventoryLogService],
  exports: [WorkshopInventoryLogService],
})
export class WorkshopInventoryLogModule {}
