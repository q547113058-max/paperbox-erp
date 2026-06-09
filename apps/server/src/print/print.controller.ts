import { Controller, Get, Param, Res, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrintService } from './print.service';
import { Response } from 'express';

@Controller('print')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrintController {
  constructor(private readonly printService: PrintService) {}

  @Get('delivery/:id')
  @Roles('boss', 'sales', 'warehouse')
  async printDelivery(@Param('id') id: number, @Res() res: Response) {
    const html = await this.printService.generateDeliveryHtml(id);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get('reconciliation/:id')
  @Roles('boss', 'finance')
  async printReconciliation(@Param('id') id: number, @Res() res: Response) {
    const html = await this.printService.generateReconciliationHtml(id);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get('order/:id')
  @Roles('boss', 'sales')
  async printOrder(@Param('id') id: number, @Res() res: Response) {
    const html = await this.printService.generateOrderHtml(id);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
