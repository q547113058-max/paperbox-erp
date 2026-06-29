import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from '../entities/deliveries';
import { DeliveryItem } from '../entities/delivery_items';
import { ReconciliationBill } from '../entities/reconciliation_bills';
import { ReconciliationItem } from '../entities/reconciliation_items';
import { Order } from '../entities/orders';
import { Customer } from '../entities/customers';
import { Company } from '../entities/company';

@Injectable()
export class PrintService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
    @InjectRepository(DeliveryItem)
    private readonly deliveryItemRepo: Repository<DeliveryItem>,
    @InjectRepository(ReconciliationBill)
    private readonly reconciliationBillRepo: Repository<ReconciliationBill>,
    @InjectRepository(ReconciliationItem)
    private readonly reconciliationItemRepo: Repository<ReconciliationItem>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  private escapeHtml(str: string | null | undefined): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async generateDeliveryHtml(deliveryId: number): Promise<string> {
    const delivery = await this.deliveryRepo.findOne({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');

    const items = await this.deliveryItemRepo.find({ where: { delivery_id: deliveryId } });
    const order = await this.orderRepo.findOne({ where: { id: delivery.order_id } });
    const customer = order ? await this.customerRepo.findOne({ where: { id: order.customer_id } }) : null;
    const company = await this.companyRepo.findOne({ where: { id: 1 } });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>送货单 ${this.escapeHtml(delivery.delivery_no)}</title>
  <style>
    body { font-family: 'Noto Sans SC', sans-serif; font-size: 14px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .company-info { text-align: left; }
    .delivery-info { text-align: right; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .footer { margin-top: 30px; display: flex; justify-content: space-between; }
    .signature { width: 200px; border-top: 1px solid #000; padding-top: 10px; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h2>${this.escapeHtml(company?.name) || '公司名称'}</h2>
      <p>地址: ${this.escapeHtml(company?.address) || '-'}</p>
      <p>电话: ${this.escapeHtml(company?.phone) || '-'}</p>
    </div>
    <div class="delivery-info">
      <h1>送货单</h1>
      <p>单号: ${this.escapeHtml(delivery.delivery_no)}</p>
      <p>日期: ${this.escapeHtml(delivery.delivery_date)}</p>
    </div>
  </div>

  <div>
    <p><strong>客户:</strong> ${this.escapeHtml(customer?.name) || '-'}</p>
    <p><strong>地址:</strong> ${this.escapeHtml(customer?.address) || '-'}</p>
    <p><strong>联系人:</strong> ${this.escapeHtml(customer?.contact) || '-'}</p>
    <p><strong>电话:</strong> ${this.escapeHtml(customer?.phone) || '-'}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>序号</th>
        <th>产品名称</th>
        <th>规格</th>
        <th>数量</th>
        <th>单位</th>
        <th>备注</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>产品 #${item.product_id}</td>
          <td>-</td>
          <td>${item.quantity}</td>
          <td>个</td>
          <td>${this.escapeHtml(item.remark) || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <div class="signature">
      <p>发货人签字:</p>
    </div>
    <div class="signature">
      <p>收货人签字:</p>
    </div>
  </div>

  <div class="no-print" style="margin-top: 20px; text-align: center;">
    <button onclick="window.print()">打印</button>
  </div>
</body>
</html>
    `;
  }

  async generateReconciliationHtml(billId: number): Promise<string> {
    const bill = await this.reconciliationBillRepo.findOne({ where: { id: billId } });
    if (!bill) throw new NotFoundException('Reconciliation bill not found');

    const items = await this.reconciliationItemRepo.find({ where: { bill_id: billId } });
    const customer = bill.customer_id ? await this.customerRepo.findOne({ where: { id: bill.customer_id } }) : null;
    const company = await this.companyRepo.findOne({ where: { id: 1 } });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>对账单 ${this.escapeHtml(bill.bill_no)}</title>
  <style>
    body { font-family: 'Noto Sans SC', sans-serif; font-size: 14px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .total { font-weight: bold; background: #f9f9f9; }
    .footer { margin-top: 30px; display: flex; justify-content: space-between; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h2>${this.escapeHtml(company?.name) || '公司名称'}</h2>
      <p>对账期间: ${this.escapeHtml(bill.period_start)} 至 ${this.escapeHtml(bill.period_end)}</p>
    </div>
    <div style="text-align: right;">
      <h1>对账单</h1>
      <p>单号: ${this.escapeHtml(bill.bill_no)}</p>
      <p>日期: ${this.escapeHtml(bill.created_at)}</p>
    </div>
  </div>

  <div>
    <p><strong>客户:</strong> ${this.escapeHtml(customer?.name) || '-'}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>日期</th>
        <th>订单号</th>
        <th>产品</th>
        <th>数量</th>
        <th>金额</th>
        <th>已付</th>
        <th>余额</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${this.escapeHtml(item.delivery_date)}</td>
          <td>${this.escapeHtml(item.delivery_no) || '-'}</td>
          <td>${this.escapeHtml(item.product_name) || '-'}</td>
          <td>${item.quantity ?? '-'}</td>
          <td>${item.amount}</td>
          <td>-</td>
          <td>-</td>
        </tr>
      `).join('')}
      <tr class="total">
        <td colspan="4">合计</td>
        <td>${items.reduce((sum, item) => sum + (item.amount || 0), 0)}</td>
        <td>-</td>
        <td>-</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <div>
      <p>应收余额: <strong>${bill.total_amount}</strong></p>
    </div>
    <div>
      <p>客户确认签字: ________________</p>
    </div>
  </div>

  <div class="no-print" style="margin-top: 20px; text-align: center;">
    <button onclick="window.print()">打印</button>
  </div>
</body>
</html>
    `;
  }

  async generateOrderHtml(orderId: number): Promise<string> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const customer = order.customer_id ? await this.customerRepo.findOne({ where: { id: order.customer_id } }) : null;
    const company = await this.companyRepo.findOne({ where: { id: 1 } });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>订单 ${this.escapeHtml(order.order_no)}</title>
  <style>
    body { font-family: 'Noto Sans SC', sans-serif; font-size: 14px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h2>${this.escapeHtml(company?.name) || '公司名称'}</h2>
    </div>
    <div style="text-align: right;">
      <h1>销售订单</h1>
      <p>订单号: ${this.escapeHtml(order.order_no)}</p>
      <p>日期: ${this.escapeHtml(order.order_date)}</p>
    </div>
  </div>

  <div class="info-grid">
    <div>
      <p><strong>客户:</strong> ${this.escapeHtml(customer?.name) || '-'}</p>
      <p><strong>联系人:</strong> ${this.escapeHtml(customer?.contact) || '-'}</p>
      <p><strong>电话:</strong> ${this.escapeHtml(customer?.phone) || '-'}</p>
    </div>
    <div>
      <p><strong>交货日期:</strong> ${this.escapeHtml(order.delivery_date)}</p>
      <p><strong>状态:</strong> ${this.escapeHtml(order.status)}</p>
      <p><strong>客户单号:</strong> ${this.escapeHtml(order.customer_order_no) || '-'}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>项目</th>
        <th>内容</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>印刷名称</td><td>${this.escapeHtml(order.print_name) || '-'}</td></tr>
      <tr><td>客户尺寸</td><td>${this.escapeHtml(order.customer_size) || '-'}</td></tr>
      <tr><td>刀模尺寸</td><td>${this.escapeHtml(order.die_size) || '-'}</td></tr>
      <tr><td>数量</td><td>${order.quantity ?? '-'}</td></tr>
      <tr><td>面纸</td><td>${this.escapeHtml(order.face_material) || '-'}</td></tr>
      <tr><td>瓦楞</td><td>${this.escapeHtml(order.medium_material) || '-'}</td></tr>
      <tr><td>印刷颜色</td><td>${this.escapeHtml(order.print_color) || '-'}</td></tr>
      <tr><td>表面处理</td><td>${this.escapeHtml(order.surface_process) || '-'}</td></tr>
    </tbody>
  </table>

  <table>
    <thead>
      <tr>
        <th>项目</th>
        <th>金额</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>总金额</td><td>${order.total_amount}</td></tr>
      <tr><td>总成本</td><td>${order.total_cost}</td></tr>
      <tr><td>利润</td><td>${order.profit}</td></tr>
    </tbody>
  </table>

  <p><strong>备注:</strong> ${this.escapeHtml(order.remark) || '-'}</p>

  <div class="no-print" style="margin-top: 20px; text-align: center;">
    <button onclick="window.print()">打印</button>
  </div>
</body>
</html>
    `;
  }
}
