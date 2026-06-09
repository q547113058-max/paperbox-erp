import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExcelController } from './excel.controller';
import { ExcelService } from './excel.service';
import { Product } from '../entities/products';
import { Customer } from '../entities/customers';
import { Supplier } from '../entities/suppliers';
import { Order } from '../entities/orders';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Customer, Supplier, Order])],
  controllers: [ExcelController],
  providers: [ExcelService],
  exports: [ExcelService],
})
export class ExcelModule {}
