import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import {Purchase} from '../entities/purchases';

@Module({
  imports: [TypeOrmModule.forFeature([Purchase])],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
