import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionOrdersController } from './production_orders.controller';
import { ProductionOrdersService } from './production_orders.service';
import {ProductionOrder} from '../entities/production_orders';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionOrder])],
  controllers: [ProductionOrdersController],
  providers: [ProductionOrdersService],
  exports: [ProductionOrdersService],
})
export class ProductionOrdersModule {}
