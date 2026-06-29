import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkshopInventoryController } from './workshop_inventory.controller';
import { WorkshopInventoryService } from './workshop_inventory.service';
import { WorkshopInventory } from '../entities/workshop_inventory';
import { WorkshopInventoryLog } from '../entities/workshop_inventory_logs';

@Module({
  imports: [TypeOrmModule.forFeature([WorkshopInventory, WorkshopInventoryLog])],
  controllers: [WorkshopInventoryController],
  providers: [WorkshopInventoryService],
  exports: [WorkshopInventoryService],
})
export class WorkshopInventoryModule {}
