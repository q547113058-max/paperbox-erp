import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintItemImageController } from './print_item_images.controller';
import { PrintItemImageService } from './print_item_images.service';
import { PrintItemImage } from '../entities/print_item_images';

@Module({
  imports: [TypeOrmModule.forFeature([PrintItemImage])],
  controllers: [PrintItemImageController],
  providers: [PrintItemImageService],
  exports: [PrintItemImageService],
})
export class PrintItemImageModule {}
