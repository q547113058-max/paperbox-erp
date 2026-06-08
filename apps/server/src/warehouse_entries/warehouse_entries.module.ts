import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseEntriesController } from './warehouse_entries.controller';
import { WarehouseEntriesService } from './warehouse_entries.service';
import {WarehouseEntry} from '../entities/warehouse_entries';

@Module({
  imports: [TypeOrmModule.forFeature([WarehouseEntry])],
  controllers: [WarehouseEntriesController],
  providers: [WarehouseEntriesService],
  exports: [WarehouseEntriesService],
})
export class WarehouseEntriesModule {}
