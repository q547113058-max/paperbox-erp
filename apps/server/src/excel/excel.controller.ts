import { Controller, Get, Post, Body, Res, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ExcelService } from './excel.service';
import { Response } from 'express';

@Controller('excel')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Get('products/export')
  @Roles('boss', 'sales', 'warehouse')
  async exportProducts(@Res() res: Response) {
    const buffer = await this.excelService.exportProducts();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=products.xlsx',
    });
    res.end(buffer);
  }

  @Post('products/import')
  @Roles('boss')
  async importProducts(@Body() data: any[]) {
    return this.excelService.importProducts(data);
  }

  @Get('customers/export')
  @Roles('boss', 'sales')
  async exportCustomers(@Res() res: Response) {
    const buffer = await this.excelService.exportCustomers();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=customers.xlsx',
    });
    res.end(buffer);
  }

  @Get('orders/export')
  @Roles('boss', 'sales', 'finance')
  async exportOrders(@Res() res: Response) {
    const buffer = await this.excelService.exportOrders();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=orders.xlsx',
    });
    res.end(buffer);
  }
}
