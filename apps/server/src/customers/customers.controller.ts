import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomersService } from './customers.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('customers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('boss', 'sales')
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  @Roles('boss', 'sales')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Roles('boss')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
