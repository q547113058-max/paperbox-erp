import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseEntriesController } from './warehouse_entries.controller';
import { WarehouseEntriesService } from './warehouse_entries.service';
import { WarehouseEntry } from '../entities/warehouse_entries';
import { WorkOrder } from '../entities/work_orders';
import { Product } from '../entities/products';
import { Delivery } from '../entities/deliveries';
import { DeliveryItem } from '../entities/delivery_items';
import { StockLog } from '../entities/stock_logs';

@Module({
  imports: [TypeOrmModule.forFeature([WarehouseEntry, WorkOrder, Product, Delivery, DeliveryItem, StockLog])],
  controllers: [WarehouseEntriesController],
  providers: [WarehouseEntriesService],
  exports: [WarehouseEntriesService],
})
export class WarehouseEntriesModule {}
