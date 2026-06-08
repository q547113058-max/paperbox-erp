import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FinanceFixedItemService } from './finance_fixed_items.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('finance_fixed_items')
@UseGuards(AuthGuard('jwt'), RolesGuard)
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
}
