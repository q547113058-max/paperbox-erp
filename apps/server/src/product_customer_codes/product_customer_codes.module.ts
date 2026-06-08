import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCustomerCodeController } from './product_customer_codes.controller';
import { ProductCustomerCodeService } from './product_customer_codes.service';
import { ProductCustomerCode } from '../entities/product_customer_codes';

@Module({
  imports: [TypeOrmModule.forFeature([ProductCustomerCode])],
  controllers: [ProductCustomerCodeController],
  providers: [ProductCustomerCodeService],
  exports: [ProductCustomerCodeService],
})
export class ProductCustomerCodeModule {}
