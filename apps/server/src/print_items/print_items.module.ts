import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintItemController } from './print_items.controller';
import { PrintItemService } from './print_items.service';
import { PrintItem } from '../entities/print_items';

@Module({
  imports: [TypeOrmModule.forFeature([PrintItem])],
  controllers: [PrintItemController],
  providers: [PrintItemService],
  exports: [PrintItemService],
})
export class PrintItemModule {}
