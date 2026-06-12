import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceFixedItemService } from './finance_fixed_items.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('finance_fixed_items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceFixedItemController {
  constructor(private readonly service: FinanceFixedItemService) {}
  @Get() findAll() { return this.service.findAll(); }
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
   * 应用固定项目到指定月份
   * POST /api/finance-fixed-items/apply
   */
  @Post('apply')
  @Roles('boss', 'finance')
  apply(@Body() body: { month: string; items: Array<{ id: number }> }) {
    return this.service.apply(body);
  }
}
