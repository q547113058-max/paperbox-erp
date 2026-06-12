import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PurchasesService } from './purchases.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('purchases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchasesController {
  constructor(private readonly service: PurchasesService) {}

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
   * 业务流程：创建采购单 + 明细
   * POST /api/purchases
   */
  @Post()
  @Roles('boss', 'warehouse')
  create(@Body() body: any) {
    return this.service.createWithItems(body);
  }

  /**
   * 业务流程：采购单审批
   * POST /api/purchases/:id/approve
   */
  @Post(':id/approve')
  @Roles('boss')
  approve(@Param('id', ParseIntPipe) id: number, @Body() body: { approved: boolean; reason?: string }) {
    return this.service.approve(id, body);
  }

  /**
   * 业务流程：采购入库（材料 → 车间库存）
   * POST /api/purchases/:id/receive
   */
  @Post(':id/receive')
  @Roles('boss', 'warehouse')
  receive(@Param('id', ParseIntPipe) id: number, @Body() body: any = {}) {
    return this.service.receive(id, body);
  }

  /**
   * 业务流程：取消采购单
   * POST /api/purchases/:id/cancel
   */
  @Post(':id/cancel')
  @Roles('boss')
  cancel(@Param('id', ParseIntPipe) id: number, @Body() body: { reason: string }) {
    return this.service.cancel(id, body);
  }

  /**
   * 打印时生成正式采购单号
   * POST /api/purchases/:id/generate-no
   */
  @Post(':id/generate-no')
  @Roles('boss', 'warehouse')
  generateNo(@Param('id', ParseIntPipe) id: number) {
    return this.service.generateNo(id);
  }

  /**
   * 更新采购单号（合并打印）
   * POST /api/purchases/:id/update-no
   */
  @Post(':id/update-no')
  @Roles('boss', 'warehouse')
  updateNo(@Param('id', ParseIntPipe) id: number, @Body() body: { purchase_no: string }) {
    return this.service.updateNo(id, body);
  }

  /**
   * 获取采购单明细
   * GET /api/purchases/:id/items
   */
  @Get(':id/items')
  getItems(@Param('id', ParseIntPipe) id: number) {
    return this.service.getItems(id);
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