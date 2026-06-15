import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ReportService } from './report.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('sales')
  @Roles('boss', 'finance', 'sales')
  async getSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.getSalesReport(startDate, endDate);
  }

  @Get('finance')
  @Roles('boss', 'finance')
  async getFinanceReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.getFinanceReport(startDate, endDate);
  }

  @Get('products')
  @Roles('boss', 'warehouse')
  async getProductReport() {
    return this.reportService.getProductReport();
  }

  @Get('customers')
  @Roles('boss', 'sales')
  async getCustomerReport() {
    return this.reportService.getCustomerReport();
  }

  @Get('dashboard')
  @Roles('boss', 'admin', 'finance', 'sales', 'warehouse')
  async getDashboardData(@Query('date') date?: string) {
    return this.reportService.getDashboardData(date);
  }
}
