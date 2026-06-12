import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReconciliationBillController } from './reconciliation_bills.controller';
import { ReconciliationBillService } from './reconciliation_bills.service';
import { ReconciliationBill } from '../entities/reconciliation_bills';
import { ReconciliationItem } from '../entities/reconciliation_items';
import { Delivery } from '../entities/deliveries';
import { DeliveryItem } from '../entities/delivery_items';
import { Customer } from '../entities/customers';

@Module({
  imports: [TypeOrmModule.forFeature([ReconciliationBill, ReconciliationItem, Delivery, DeliveryItem, Customer])],
  controllers: [ReconciliationBillController],
  providers: [ReconciliationBillService],
  exports: [ReconciliationBillService],
})
export class ReconciliationBillModule {}