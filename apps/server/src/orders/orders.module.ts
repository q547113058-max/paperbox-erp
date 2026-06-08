import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from '../entities/orders';
import { OrderItem } from '../entities/order_items';
import { Customer } from '../entities/customers';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Customer])],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
