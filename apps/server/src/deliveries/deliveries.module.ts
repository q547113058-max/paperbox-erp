import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';
import {Delivery} from '../entities/deliveries';

@Module({
  imports: [TypeOrmModule.forFeature([Delivery])],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
