import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceRecordController } from './finance_records.controller';
import { FinanceRecordService } from './finance_records.service';
import { FinanceRecord } from '../entities/finance_records';

@Module({
  imports: [TypeOrmModule.forFeature([FinanceRecord])],
  controllers: [FinanceRecordController],
  providers: [FinanceRecordService],
  exports: [FinanceRecordService],
})
export class FinanceRecordModule {}
