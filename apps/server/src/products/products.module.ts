import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from '../entities/products';
import { PrintItem } from '../entities/print_items';
import { PrintItemImage } from '../entities/print_item_images';

@Module({
  imports: [TypeOrmModule.forFeature([Product, PrintItem, PrintItemImage])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}