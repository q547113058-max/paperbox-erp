import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColorPrintsController } from './color_prints.controller';
import { ColorPrintsService } from './color_prints.service';
import {ColorPrint} from '../entities/color_prints';

@Module({
  imports: [TypeOrmModule.forFeature([ColorPrint])],
  controllers: [ColorPrintsController],
  providers: [ColorPrintsService],
  exports: [ColorPrintsService],
})
export class ColorPrintsModule {}
