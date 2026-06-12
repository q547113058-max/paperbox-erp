import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OutsourcingOrderService } from './outsourcing_orders.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('outsourcing_orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OutsourcingOrderController {
  constructor(private readonly service: OutsourcingOrderService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  @Roles('boss', 'warehouse')
  create(@Body() body: any) { return this.service.createOrder(body); }

  /**
   * 业务流程：委外完成 → 自动入库
   * POST /api/outsourcing_orders/:id/complete
   */
  @Post(':id/complete')
  @Roles('boss', 'warehouse')
  complete(@Param('id', ParseIntPipe) id: number, @Body() body: { received_qty: number; finished_quantity?: number }) {
    return this.service.complete(id, body);
  }

  /**
   * 业务流程：委外领用
   * POST /api/outsourcing_orders/:id/entry
   */
  @Post(':id/entry')
  @Roles('boss', 'warehouse')
  entry(@Param('id', ParseIntPipe) id: number, @Body() body: { quantity: number; remark?: string }) {
    return this.service.createEntry(id, body);
  }

  /**
   * 业务流程：取消委外单
   * POST /api/outsourcing_orders/:id/cancel
   */
  @Post(':id/cancel')
  @Roles('boss')
  cancel(@Param('id', ParseIntPipe) id: number, @Body() body: { reason: string }) {
    return this.service.cancel(id, body);
  }

  /**
   * 业务流程：委外结算
   * POST /api/outsourcing_orders/:id/settle
   */
  @Post(':id/settle')
  @Roles('boss', 'finance')
  settle(@Param('id', ParseIntPipe) id: number, @Body() body: { unit_price?: number }) {
    return this.service.settle(id, body);
  }

  @Put(':id')
  @Roles('boss', 'warehouse')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.service.update(id, body); }

  @Delete(':id')
  @Roles('boss')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}