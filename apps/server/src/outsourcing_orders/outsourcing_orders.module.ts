import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutsourcingOrderController } from './outsourcing_orders.controller';
import { OutsourcingOrderService } from './outsourcing_orders.service';
import { OutsourcingOrder } from '../entities/outsourcing_orders';
import { OutsourcingEntry } from '../entities/outsourcing_entries';
import { WorkshopInventory } from '../entities/workshop_inventory';
import { WorkshopInventoryLog } from '../entities/workshop_inventory_logs';

@Module({
  imports: [TypeOrmModule.forFeature([OutsourcingOrder, OutsourcingEntry, WorkshopInventory, WorkshopInventoryLog])],
  controllers: [OutsourcingOrderController],
  providers: [OutsourcingOrderService],
  exports: [OutsourcingOrderService],
})
export class OutsourcingOrderModule {}