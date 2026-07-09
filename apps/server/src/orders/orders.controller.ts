import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  /** 返回订单明细列表（平铺，含订单/客户/产品信息） */
  @Get('items')
  findAllItems() {
    return this.service.findAllItems();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('boss', 'sales')
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  @Roles('boss', 'sales')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Put(':id/status')
  @Roles('boss', 'sales', 'warehouse')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() body: { status: string }) {
    return this.service.updateStatus(id, body.status);
  }

  @Delete(':id')
  @Roles('boss')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  /**
   * 手动结单（更新订单明细已发货数量）
   * PUT /api/orders/items/:id/manual-close
   */
  @Put('items/:id/manual-close')
  @Roles('boss', 'sales', 'warehouse')
  manualCloseItem(@Param('id', ParseIntPipe) id: number, @Body() body: { delivered_qty: number }) {
    return this.service.manualCloseItem(id, body);
  }
}
