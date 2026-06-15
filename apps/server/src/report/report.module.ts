import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { Order } from '../entities/orders';
import { FinanceRecord } from '../entities/finance_records';
import { Product } from '../entities/products';
import { Customer } from '../entities/customers';
import { Purchase } from '../entities/purchases';
import { Delivery } from '../entities/deliveries';
import { Material } from '../entities/materials';

import { PurchaseItem } from '../entities/purchase_items';

@Module({
  imports: [TypeOrmModule.forFeature([Order, FinanceRecord, Product, Customer, Purchase, PurchaseItem, Delivery, Material])],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
