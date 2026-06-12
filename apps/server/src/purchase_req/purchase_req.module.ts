import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseReqController } from './purchase_req.controller';
import { PurchaseReqService } from './purchase_req.service';
import { Material } from '../entities/materials';
import { Product } from '../entities/products';
import { Order } from '../entities/orders';
import { OrderItem } from '../entities/order_items';
import { WorkOrder } from '../entities/work_orders';
import { Purchase } from '../entities/purchases';
import { PurchaseItem } from '../entities/purchase_items';
import { FinanceRecord } from '../entities/finance_records';
import { Supplier } from '../entities/suppliers';

@Module({
  imports: [TypeOrmModule.forFeature([Material, Product, Order, OrderItem, WorkOrder, Purchase, PurchaseItem, FinanceRecord, Supplier])],
  controllers: [PurchaseReqController],
  providers: [PurchaseReqService],
  exports: [PurchaseReqService],
})
export class PurchaseReqModule {}
