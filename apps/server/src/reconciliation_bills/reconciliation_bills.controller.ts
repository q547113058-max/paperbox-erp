import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReconciliationBillService } from './reconciliation_bills.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('reconciliation_bills')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReconciliationBillController {
  constructor(private readonly service: ReconciliationBillService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  /**
   * 业务流程：自动生成对账单（拉取已签收发货单）
   * POST /api/reconciliation_bills/generate
   */
  @Post('generate')
  @Roles('boss', 'finance')
  generate(@Body() body: { customer_id: number; period_start: string; period_end: string; remark?: string }) {
    return this.service.generate(body);
  }

  /**
   * 业务流程：确认对账单
   * POST /api/reconciliation_bills/:id/confirm
   */
  @Post(':id/confirm')
  @Roles('boss', 'finance')
  confirm(@Param('id', ParseIntPipe) id: number, @Body() body: { remark?: string }) {
    return this.service.confirm(id, body);
  }

  /**
   * 业务流程：取消对账单
   * POST /api/reconciliation_bills/:id/cancel
   */
  @Post(':id/cancel')
  @Roles('boss', 'finance')
  cancel(@Param('id', ParseIntPipe) id: number, @Body() body: { reason: string }) {
    return this.service.cancel(id, body);
  }

  @Post()
  @Roles('boss', 'finance')
  create(@Body() body: any) { return this.service.create(body); }

  @Put(':id')
  @Roles('boss', 'finance')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.service.update(id, body); }

  @Delete(':id')
  @Roles('boss')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}