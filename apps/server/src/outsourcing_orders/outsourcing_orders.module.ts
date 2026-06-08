import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutsourcingOrderController } from './outsourcing_orders.controller';
import { OutsourcingOrderService } from './outsourcing_orders.service';
import { OutsourcingOrder } from '../entities/outsourcing_orders';

@Module({
  imports: [TypeOrmModule.forFeature([OutsourcingOrder])],
  controllers: [OutsourcingOrderController],
  providers: [OutsourcingOrderService],
  exports: [OutsourcingOrderService],
})
export class OutsourcingOrderModule {}
