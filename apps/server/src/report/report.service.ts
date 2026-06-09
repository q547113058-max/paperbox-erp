import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Order } from '../entities/orders';
import { FinanceRecord } from '../entities/finance_records';
import { Product } from '../entities/products';
import { Customer } from '../entities/customers';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(FinanceRecord)
    private readonly financeRepo: Repository<FinanceRecord>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async getSalesReport(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate && endDate) {
      where.order_date = Between(startDate, endDate);
    } else if (startDate) {
      where.order_date = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.order_date = LessThanOrEqual(endDate);
    }

    const orders = await this.orderRepo.find({ where });

    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalCost = orders.reduce((sum, o) => sum + (o.total_cost || 0), 0);
    const totalProfit = orders.reduce((sum, o) => sum + (o.profit || 0), 0);

    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const monthlyData = orders.reduce((acc, o) => {
      const month = o.order_date?.substring(0, 7) || 'unknown';
      if (!acc[month]) {
        acc[month] = { orders: 0, amount: 0, cost: 0, profit: 0 };
      }
      acc[month].orders++;
      acc[month].amount += o.total_amount || 0;
      acc[month].cost += o.total_cost || 0;
      acc[month].profit += o.profit || 0;
      return acc;
    }, {} as Record<string, any>);

    return {
      summary: {
        totalOrders,
        totalAmount,
        totalCost,
        totalProfit,
        profitRate: totalAmount > 0 ? ((totalProfit / totalAmount) * 100).toFixed(2) : 0,
      },
      statusCounts,
      monthlyData,
      orders: orders.slice(0, 100),
    };
  }

  async getFinanceReport(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate && endDate) {
      where.created_at = Between(startDate, endDate);
    }

    const records = await this.financeRepo.find({ where });

    const totalIncome = records
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const totalExpense = records
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const typeBreakdown = records.reduce((acc, r) => {
      if (!acc[r.type]) {
        acc[r.type] = { count: 0, amount: 0 };
      }
      acc[r.type].count++;
      acc[r.type].amount += r.amount || 0;
      return acc;
    }, {} as Record<string, any>);

    return {
      summary: {
        totalRecords: records.length,
        totalIncome,
        totalExpense,
        netIncome: totalIncome - totalExpense,
      },
      typeBreakdown,
      records: records.slice(0, 100),
    };
  }

  async getProductReport() {
    const products = await this.productRepo.find();

    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock_qty || 0), 0);
    const lowStockProducts = products.filter(p => p.stock_qty < (p.safety_stock || 0));

    const categoryBreakdown = products.reduce((acc, p) => {
      const category = p.product_type || '未分类';
      if (!acc[category]) {
        acc[category] = { count: 0, stock: 0 };
      }
      acc[category].count++;
      acc[category].stock += p.stock_qty || 0;
      return acc;
    }, {} as Record<string, any>);

    return {
      summary: {
        totalProducts,
        totalStock,
        lowStockCount: lowStockProducts.length,
      },
      categoryBreakdown,
      lowStockProducts,
      products: products.slice(0, 100),
    };
  }

  async getCustomerReport() {
    const customers = await this.customerRepo.find();
    const orders = await this.orderRepo.find();

    const customerOrders = orders.reduce((acc, o) => {
      if (!acc[o.customer_id]) {
        acc[o.customer_id] = { orders: 0, amount: 0 };
      }
      acc[o.customer_id].orders++;
      acc[o.customer_id].amount += o.total_amount || 0;
      return acc;
    }, {} as Record<string, any>);

    const topCustomers = customers
      .map(c => ({
        ...c,
        orderCount: customerOrders[c.id]?.orders || 0,
        totalAmount: customerOrders[c.id]?.amount || 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 20);

    return {
      summary: {
        totalCustomers: customers.length,
        activeCustomers: Object.keys(customerOrders).length,
      },
      topCustomers,
    };
  }
}
