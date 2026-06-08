import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReconciliationItemController } from './reconciliation_items.controller';
import { ReconciliationItemService } from './reconciliation_items.service';
import { ReconciliationItem } from '../entities/reconciliation_items';

@Module({
  imports: [TypeOrmModule.forFeature([ReconciliationItem])],
  controllers: [ReconciliationItemController],
  providers: [ReconciliationItemService],
  exports: [ReconciliationItemService],
})
export class ReconciliationItemModule {}
