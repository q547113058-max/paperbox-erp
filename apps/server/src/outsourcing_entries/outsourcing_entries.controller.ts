import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OutsourcingEntryService } from './outsourcing_entries.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('outsourcing_entries')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class OutsourcingEntryController {
  constructor(private readonly service: OutsourcingEntryService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
  @Post()
  @Roles('boss', 'warehouse')
  create(@Body() body: any) { return this.service.create(body); }
  @Put(':id')
  @Roles('boss', 'warehouse')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.service.update(id, body); }
  @Delete(':id')
  @Roles('boss')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
