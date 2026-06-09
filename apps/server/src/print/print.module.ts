import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintController } from './print.controller';
import { PrintService } from './print.service';
import { Delivery } from '../entities/deliveries';
import { DeliveryItem } from '../entities/delivery_items';
import { ReconciliationBill } from '../entities/reconciliation_bills';
import { ReconciliationItem } from '../entities/reconciliation_items';
import { Order } from '../entities/orders';
import { Customer } from '../entities/customers';
import { Company } from '../entities/company';

@Module({
  imports: [TypeOrmModule.forFeature([Delivery, DeliveryItem, ReconciliationBill, ReconciliationItem, Order, Customer, Company])],
  controllers: [PrintController],
  providers: [PrintService],
  exports: [PrintService],
})
export class PrintModule {}
