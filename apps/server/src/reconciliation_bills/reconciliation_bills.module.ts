import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReconciliationBillController } from './reconciliation_bills.controller';
import { ReconciliationBillService } from './reconciliation_bills.service';
import { ReconciliationBill } from '../entities/reconciliation_bills';

@Module({
  imports: [TypeOrmModule.forFeature([ReconciliationBill])],
  controllers: [ReconciliationBillController],
  providers: [ReconciliationBillService],
  exports: [ReconciliationBillService],
})
export class ReconciliationBillModule {}
