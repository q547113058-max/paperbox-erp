import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { Order } from '../entities/orders';
import { FinanceRecord } from '../entities/finance_records';
import { Product } from '../entities/products';
import { Customer } from '../entities/customers';

@Module({
  imports: [TypeOrmModule.forFeature([Order, FinanceRecord, Product, Customer])],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
