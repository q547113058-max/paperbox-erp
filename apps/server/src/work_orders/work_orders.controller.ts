import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkOrdersService } from './work_orders.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('work_orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkOrdersController {
  constructor(private readonly service: WorkOrdersService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  /**
   * 业务流程：订单 → 自动生成工单
   * POST /api/work_orders/from-order
   */
  @Post('from-order')
  @Roles('boss', 'sales', 'warehouse')
  generateFromOrder(@Body() body: { order_id: number; items?: any[] }) {
    return this.service.generateFromOrder(body);
  }

  /**
   * 业务流程：从产品直接生成工单
   * POST /api/work-orders/from-product
   */
  @Post('from-product')
  @Roles('boss', 'warehouse')
  generateFromProduct(@Body() body: { product_id: number; quantity: number; priority?: string }) {
    return this.service.generateFromProduct(body);
  }

  /**
   * 业务流程：批量从订单生成工单
   * POST /api/work-orders/batch-from-orders
   */
  @Post('batch-from-orders')
  @Roles('boss', 'sales', 'warehouse')
  batchFromOrders(@Body() body: { order_ids: number[] }) {
    return this.service.batchFromOrders(body);
  }

  /**
   * 业务流程：工单排产
   * PUT /api/work_orders/:id/schedule
   */
  @Put(':id/schedule')
  @Roles('boss', 'warehouse')
  schedule(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.schedule(id, body);
  }

  /**
   * 业务流程：工单开始生产
   * PUT /api/work_orders/:id/start
   */
  @Put(':id/start')
  @Roles('boss', 'warehouse')
  start(@Param('id', ParseIntPipe) id: number) {
    return this.service.start(id);
  }

  /**
   * 业务流程：工单完工 → 自动入库
   * POST /api/work_orders/:id/complete
   */
  @Post(':id/complete')
  @Roles('boss', 'warehouse')
  complete(@Param('id', ParseIntPipe) id: number, @Body() body: { completed_qty: number; entry_code?: string; remark?: string }) {
    return this.service.complete(id, body);
  }

  /**
   * 业务流程：取消工单
   * POST /api/work_orders/:id/cancel
   */
  @Post(':id/cancel')
  @Roles('boss', 'sales')
  cancel(@Param('id', ParseIntPipe) id: number, @Body() body: { reason: string }) {
    return this.service.cancel(id, body);
  }

  /**
   * 业务流程：部分完成工单（累加完成数量，自动创建进仓单）
   * POST /api/work-orders/:id/partial-complete
   */
  @Post(':id/partial-complete')
  @Roles('boss', 'warehouse')
  partialComplete(@Param('id', ParseIntPipe) id: number, @Body() body: { completed_qty: number }) {
    return this.service.partialComplete(id, body);
  }

  /**
   * 获取工单物料列表
   * GET /api/work-orders/:id/materials
   */
  @Get(':id/materials')
  getMaterials(@Param('id', ParseIntPipe) id: number) {
    return this.service.getMaterials(id);
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
}