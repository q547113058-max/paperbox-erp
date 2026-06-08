import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrderMaterialController } from './work_order_materials.controller';
import { WorkOrderMaterialService } from './work_order_materials.service';
import { WorkOrderMaterial } from '../entities/work_order_materials';

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrderMaterial])],
  controllers: [WorkOrderMaterialController],
  providers: [WorkOrderMaterialService],
  exports: [WorkOrderMaterialService],
})
export class WorkOrderMaterialModule {}
