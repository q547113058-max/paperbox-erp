import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceFixedItemController } from './finance_fixed_items.controller';
import { FinanceFixedItemService } from './finance_fixed_items.service';
import { FinanceFixedItem } from '../entities/finance_fixed_items';
import { FinanceRecord } from '../entities/finance_records';

@Module({
  imports: [TypeOrmModule.forFeature([FinanceFixedItem, FinanceRecord])],
  controllers: [FinanceFixedItemController],
  providers: [FinanceFixedItemService],
  exports: [FinanceFixedItemService],
})
export class FinanceFixedItemModule {}
