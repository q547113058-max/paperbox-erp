import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockLogController } from './stock_logs.controller';
import { StockLogService } from './stock_logs.service';
import { StockLog } from '../entities/stock_logs';

@Module({
  imports: [TypeOrmModule.forFeature([StockLog])],
  controllers: [StockLogController],
  providers: [StockLogService],
  exports: [StockLogService],
})
export class StockLogModule {}
