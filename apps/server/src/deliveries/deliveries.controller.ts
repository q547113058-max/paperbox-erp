import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeliveriesService } from './deliveries.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliveriesController {
  constructor(private readonly service: DeliveriesService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get('by-no/:no')
  findByNo(@Param('no') no: string) {
    return this.service.findByNo(no);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  /**
   * 业务流程：从工单/订单自动创建发货单 + 库存扣减
   * POST /api/deliveries/from-work-order
   */
  @Post('from-work-order')
  @Roles('boss', 'warehouse')
  generateFromWorkOrder(@Body() body: any) {
    return this.service.generateFromWorkOrder(body);
  }

  /**
   * 业务流程：从订单直接创建发货单
   * POST /api/deliveries/from-order
   */
  @Post('from-order')
  @Roles('boss', 'warehouse')
  generateFromOrder(@Body() body: any) {
    return this.service.generateFromOrder(body);
  }

  /**
   * 业务流程：发货
   * PUT /api/deliveries/:id/ship
   */
  @Put(':id/ship')
  @Roles('boss', 'warehouse')
  ship(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.ship(id, body);
  }

  /**
   * 业务流程：签收
   * POST /api/deliveries/:id/sign
   */
  @Post(':id/sign')
  @Roles('boss', 'warehouse', 'sales')
  sign(@Param('id', ParseIntPipe) id: number, @Body() body: { remark?: string }) {
    return this.service.sign(id, body);
  }

  /**
   * 业务流程：批量发货
   * POST /api/deliveries/batch-ship
   */
  @Post('batch-ship')
  @Roles('boss', 'warehouse')
  batchShip(@Body() body: { order_ids: number[]; delivery_person?: string; address?: string }) {
    return this.service.batchShip(body);
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