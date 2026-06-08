import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseItemController } from './purchase_items.controller';
import { PurchaseItemService } from './purchase_items.service';
import { PurchaseItem } from '../entities/purchase_items';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseItem])],
  controllers: [PurchaseItemController],
  providers: [PurchaseItemService],
  exports: [PurchaseItemService],
})
export class PurchaseItemModule {}
