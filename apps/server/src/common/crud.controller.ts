import {
  Controller, Get, Post, Put, Delete,
  Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CrudService } from './crud.service';

/**
 * Base CRUD controller. Extend and add @Controller + @Roles decorators.
 *
 * Usage:
 *   @Controller('customers')
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   export class CustomersController extends CrudController<Customer> {
 *     constructor(service: CustomersService) { super(service); }
 *   }
 */
export class CrudController<T> {
  constructor(protected readonly service: CrudService<T>) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  @Roles('boss', 'sales')
  create(@Body() body: any) { return this.service.create(body); }

  @Put(':id')
  @Roles('boss', 'sales')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.service.update(id, body); }

  @Delete(':id')
  @Roles('boss')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
