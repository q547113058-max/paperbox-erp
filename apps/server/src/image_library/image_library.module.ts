import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageLibraryController } from './image_library.controller';
import { ImageLibraryService } from './image_library.service';
import { Product } from '../entities/products';
import { KnifeDie } from '../entities/knife_dies';
import { PrintItemImage } from '../entities/print_item_images';
import { PrintItem } from '../entities/print_items';
import { ColorPrint } from '../entities/color_prints';

@Module({
  imports: [TypeOrmModule.forFeature([Product, KnifeDie, PrintItemImage, PrintItem, ColorPrint])],
  controllers: [ImageLibraryController],
  providers: [ImageLibraryService],
  exports: [ImageLibraryService],
})
export class ImageLibraryModule {}
