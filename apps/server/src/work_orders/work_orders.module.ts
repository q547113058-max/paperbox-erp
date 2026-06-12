import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrdersController } from './work_orders.controller';
import { WorkOrdersService } from './work_orders.service';
import { WorkOrder } from '../entities/work_orders';
import { Order } from '../entities/orders';
import { OrderItem } from '../entities/order_items';
import { Product } from '../entities/products';
import { WorkshopInventory } from '../entities/workshop_inventory';
import { WorkshopInventoryLog } from '../entities/workshop_inventory_logs';
import { OutsourcingOrder } from '../entities/outsourcing_orders';
import { OutsourcingEntry } from '../entities/outsourcing_entries';
import { WarehouseEntry } from '../entities/warehouse_entries';
import { StockLog } from '../entities/stock_logs';

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrder, Order, OrderItem, Product, WorkshopInventory, WorkshopInventoryLog, OutsourcingOrder, OutsourcingEntry, WarehouseEntry, StockLog])],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
