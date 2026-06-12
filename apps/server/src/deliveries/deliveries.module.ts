import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';
import { Delivery } from '../entities/deliveries';
import { DeliveryItem } from '../entities/delivery_items';
import { Order } from '../entities/orders';
import { OrderItem } from '../entities/order_items';
import { Product } from '../entities/products';
import { WorkshopInventory } from '../entities/workshop_inventory';
import { WorkshopInventoryLog } from '../entities/workshop_inventory_logs';

@Module({
  imports: [TypeOrmModule.forFeature([Delivery, DeliveryItem, Order, OrderItem, Product, WorkshopInventory, WorkshopInventoryLog])],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}