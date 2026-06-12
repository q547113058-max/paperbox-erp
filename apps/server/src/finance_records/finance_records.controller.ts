import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceRecordService } from './finance_records.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('finance_records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceRecordController {
  constructor(private readonly service: FinanceRecordService) {}
  @Get() findAll() { return this.service.findAll(); }

  /**
   * 财务汇总（应收/应付/收入/支出/利润）
   * GET /api/finance-records/summary
   */
  @Get('summary')
  summary() { return this.service.summary(); }

  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
  @Post()
  @Roles('boss', 'finance')
  create(@Body() body: any) { return this.service.create(body); }
  @Put(':id')
  @Roles('boss', 'finance')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.service.update(id, body); }
  @Delete(':id')
  @Roles('boss', 'finance')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }

  /**
   * 结算（标记已结清）
   * PUT /api/finance-records/:id/settle
   */
  @Put(':id/settle')
  @Roles('boss', 'finance')
  settle(@Param('id', ParseIntPipe) id: number) { return this.service.settle(id); }

  /**
   * 冲正（标记已冲正 + 写反向记录）
   * POST /api/finance-records/:id/cancel
   */
  @Post(':id/cancel')
  @Roles('boss', 'finance')
  cancel(@Param('id', ParseIntPipe) id: number, @Body() body: { reason: string; username?: string }) {
    return this.service.cancel(id, body);
  }
}
