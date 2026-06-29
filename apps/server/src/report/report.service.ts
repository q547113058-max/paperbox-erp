import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, Like } from 'typeorm';
import { Order } from '../entities/orders';
import { FinanceRecord } from '../entities/finance_records';
import { Product } from '../entities/products';
import { Customer } from '../entities/customers';
import { Purchase } from '../entities/purchases';
import { Delivery } from '../entities/deliveries';
import { Material } from '../entities/materials';
import { PurchaseItem } from '../entities/purchase_items';

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
    @InjectRepository(Purchase)
    private readonly purchaseRepo: Repository<Purchase>,
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,
    @InjectRepository(PurchaseItem)
    private readonly purchaseItemRepo: Repository<PurchaseItem>,
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

  /** 仪表盘聚合数据 — 参考易纸箱首页 */
  async getDashboardData(date?: string) {
    const target = date ? new Date(date + '-01') : new Date();
    const year = target.getFullYear();
    const month = target.getMonth();

    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const nextMonth = month === 11 ? `${year + 1}-01-01` : `${year}-${String(month + 2).padStart(2, '0')}-01`;
    const prevMonth = month === 0 ? `${year - 1}-12-01` : `${year}-${String(month).padStart(2, '0')}-01`;
    const lastYearStart = `${year - 1}-${String(month + 1).padStart(2, '0')}-01`;
    const lastYearEnd = month === 11 ? `${year}-01-01` : `${year - 1}-${String(month + 2).padStart(2, '0')}-01`;

    // WARNING: Production risk — loading all records without limits. Consider date-filtered queries.
    const [orders, purchases, purchaseItems, deliveries, financeRecords, customers] = await Promise.all([
      this.orderRepo.find({ take: 2000 }),
      this.purchaseRepo.find({ take: 2000 }),
      this.purchaseItemRepo.find({ take: 5000 }),
      this.deliveryRepo.find({ take: 2000 }),
      this.financeRepo.find({ take: 5000 }),
      this.customerRepo.find({ take: 500 }),
    ]);

    // --- 采购统计 ---
    const monthPurchases = purchases.filter(p => p.created_at && p.created_at >= monthStart && p.created_at < nextMonth);
    const purchaseAmount = monthPurchases.reduce((s, p) => s + (p.total_amount || 0), 0);
    const prevMonthPurchases = purchases.filter(p => p.created_at && p.created_at >= prevMonth && p.created_at < monthStart);
    const prevPurchaseAmount = prevMonthPurchases.reduce((s, p) => s + (p.total_amount || 0), 0);

    // --- 材料采购排名 (from purchase_items) ---
    const monthPurchaseIds = new Set(monthPurchases.map(p => p.id));
    const itemAmounts: Record<string, { name: string; amount: number; qty: number }> = {};
    (purchaseItems as any[]).forEach((pi: any) => {
      if (monthPurchaseIds.has(pi.purchase_id)) {
        const key = pi.material_name || '未命名';
        if (!itemAmounts[key]) itemAmounts[key] = { name: key, amount: 0, qty: 0 };
        itemAmounts[key].amount += pi.amount || 0;
        itemAmounts[key].qty += pi.quantity || 0;
      }
    });
    const materialRanking = Object.values(itemAmounts)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // --- 订单统计 ---
    const monthOrders = orders.filter(o => {
      const d = o.created_at || o.delivery_date;
      return d && d >= monthStart && d < nextMonth;
    });
    const orderAmount = monthOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const orderProfit = monthOrders.reduce((s, o) => s + (o.profit || 0), 0);
    const prevMonthOrders = orders.filter(o => {
      const d = o.created_at || o.delivery_date;
      return d && d >= prevMonth && d < monthStart;
    });
    const prevOrderAmount = prevMonthOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const lastYearOrders = orders.filter(o => {
      const d = o.created_at || o.delivery_date;
      return d && d >= lastYearStart && d < lastYearEnd;
    });
    const lastYearOrderAmount = lastYearOrders.reduce((s, o) => s + (o.total_amount || 0), 0);

    // --- 送货统计 ---
    const monthDeliveries = deliveries.filter(d => d.created_at && d.created_at >= monthStart && d.created_at < nextMonth);
    const deliveryCount = monthDeliveries.length;

    // --- 客户账款 ---
    let totalAR = 0, totalPaid = 0;
    const customerSet = new Set<string>();
    financeRecords.forEach(r => {
      if (r.type === '应收' || r.type === 'income') {
        totalAR += r.amount || 0;
        if (r.party_name) customerSet.add(r.party_name);
      } else if (r.type === '收款' || r.type === 'expense') {
        totalPaid += r.amount || 0;
      }
    });
    const remaining = totalAR - totalPaid;
    const debtorCount = customerSet.size;

    // 当月收款
    const monthPayments = financeRecords.filter(r =>
      (r.type === '收款') && r.created_at && r.created_at >= monthStart && r.created_at < nextMonth
    );
    const monthCollected = monthPayments.reduce((s, r) => s + (r.amount || 0), 0);

    // --- 月度趋势 ---
    const monthlyTrend: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - i, 1);
      const mStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const mEnd = d.getMonth() === 11
        ? `${d.getFullYear() + 1}-01-01`
        : `${d.getFullYear()}-${String(d.getMonth() + 2).padStart(2, '0')}-01`;
      const mOrders = orders.filter(o => {
        const dt = o.created_at || o.delivery_date;
        return dt && dt >= mStart && dt < mEnd;
      });
      const mPurchases = purchases.filter(p => p.created_at && p.created_at >= mStart && p.created_at < mEnd);
      monthlyTrend.push({
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        orders: mOrders.reduce((s, o) => s + (o.total_amount || 0), 0),
        purchases: mPurchases.reduce((s, p) => s + (p.total_amount || 0), 0),
        profit: mOrders.reduce((s, o) => s + (o.profit || 0), 0),
      });
    }

    const calcRatio = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(1));
    };

    return {
      purchase: {
        amount: purchaseAmount,
        mom: calcRatio(purchaseAmount, prevPurchaseAmount),
        yoy: calcRatio(purchaseAmount, 0),
        ranking: materialRanking,
      },
      order: {
        amount: orderAmount,
        profit: orderProfit,
        mom: calcRatio(orderAmount, prevOrderAmount),
        yoy: calcRatio(orderAmount, lastYearOrderAmount),
      },
      delivery: {
        count: deliveryCount,
      },
      customerAccounts: {
        totalAR,
        totalPaid,
        remaining,
        debtorCount,
        receivableCount: customerSet.size,
        monthCollected,
      },
      monthlyTrend,
      lowStock: 0,
      totalProducts: 0,
      totalOrders: orders.length,
    };
  }
}
