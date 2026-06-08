import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkshopInventoryLogService } from './workshop_inventory_logs.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('workshop_inventory_logs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class WorkshopInventoryLogController {
  constructor(private readonly service: WorkshopInventoryLogService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
  @Post()
  @Roles('boss')
  create(@Body() body: any) { return this.service.create(body); }
  @Put(':id')
  @Roles('boss')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.service.update(id, body); }
  @Delete(':id')
  @Roles('boss')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
