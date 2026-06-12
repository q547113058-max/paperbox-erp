import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WarehouseEntriesService } from './warehouse_entries.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('warehouse-entries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehouseEntriesController {
  constructor(private readonly service: WarehouseEntriesService) {}

  // ========== 基础 CRUD ==========

  @Get()
  findAll() { return this.service.findAll(); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('boss', 'warehouse')
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  @Roles('boss', 'warehouse')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Roles('boss')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  // ========== 业务端点 ==========

  /**
   * 从工单创建进仓单（支持部分进仓）
   * body: { work_order_id, quantity, remark? }
   */
  @Post('from-workorder')
  @Roles('boss', 'warehouse')
  fromWorkOrder(@Body() body: any) {
    return this.service.fromWorkOrder(body);
  }

  /**
   * 通过进仓码扫码查找工单信息
   */
  @Get('lookup/:entryCode')
  lookupByCode(@Param('entryCode') entryCode: string) {
    return this.service.lookupByCode(entryCode);
  }

  /**
   * 通过进仓码扫码创建进仓单
   * body: { entry_code, quantity, remark? }
   */
  @Post('by-code')
  @Roles('boss', 'warehouse')
  byCode(@Body() body: any) {
    return this.service.byCode(body);
  }

  /**
   * 更新进仓单状态
   * body: { status: '待发货'|'部分发货'|'已发货'|'已取消' }
   */
  @Put(':id/status')
  @Roles('boss', 'warehouse')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.updateStatus(id, body.status);
  }

  /**
   * 从进仓单创建送货单
   * body: { delivery_date?, address?, remark? }
   */
  @Post(':id/create-delivery')
  @Roles('boss', 'warehouse')
  createDelivery(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.createDelivery(id, body);
  }

  /**
   * 批量创建送货单（合并同客户多个进仓单）
   * body: { entry_ids: number[], delivery_date?, address?, remark? }
   */
  @Post('batch-delivery')
  @Roles('boss', 'warehouse')
  batchDelivery(@Body() body: any) {
    return this.service.batchDelivery(body);
  }

  /**
   * 获取工单的进仓记录及汇总
   */
  @Get('work-order/:workOrderId')
  getWorkOrderEntries(@Param('workOrderId', ParseIntPipe) workOrderId: number) {
    return this.service.getWorkOrderEntries(workOrderId);
  }
}
