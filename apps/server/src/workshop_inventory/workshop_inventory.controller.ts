import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkshopInventoryService } from './workshop_inventory.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('workshop_inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkshopInventoryController {
  constructor(private readonly service: WorkshopInventoryService) {}
  @Get() findAll() { return this.service.findAll(); }

  /**
   * 库存汇总（按物料分组统计）
   * GET /api/workshop-inventory/summary
   */
  @Get('summary')
  summary() { return this.service.summary(); }

  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
  @Post()
  @Roles('boss', 'warehouse')
  create(@Body() body: any) { return this.service.create(body); }

  /**
   * 发料（从车间库存扣减）
   * POST /api/workshop-inventory/issue
   */
  @Post('issue')
  @Roles('boss', 'warehouse')
  issue(@Body() body: any) { return this.service.issue(body); }
  @Put(':id')
  @Roles('boss', 'warehouse')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.service.update(id, body); }
  @Delete(':id')
  @Roles('boss')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
