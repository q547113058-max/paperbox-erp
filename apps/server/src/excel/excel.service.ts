import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { Product } from '../entities/products';
import { Customer } from '../entities/customers';
import { Supplier } from '../entities/suppliers';
import { Order } from '../entities/orders';

@Injectable()
export class ExcelService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async exportProducts(): Promise<Buffer> {
    const products = await this.productRepo.find();
    const data = products.map(p => ({
      '产品编号': p.code,
      '名称': p.name,
      '规格': p.spec,
      '长': p.length,
      '宽': p.width,
      '高': p.height,
      '材质': p.material,
      '单位': p.unit,
      '单价': p.unit_price,
      '成本': p.cost,
      '库存': p.stock_qty,
      '安全库存': p.safety_stock,
      '状态': p.status,
    }));
    return this.createExcel(data, '产品');
  }

  async exportCustomers(): Promise<Buffer> {
    const customers = await this.customerRepo.find();
    const data = customers.map(c => ({
      '名称': c.name,
      '联系人': c.contact,
      '电话': c.phone,
      '地址': c.address,
      '业务员': c.salesman,
      '账期': c.payment_cycle,
      '回款率': c.rebate_percent,
    }));
    return this.createExcel(data, '客户');
  }

  async exportOrders(): Promise<Buffer> {
    const orders = await this.orderRepo.find();
    const data = orders.map(o => ({
      '订单号': o.order_no,
      '客户ID': o.customer_id,
      '状态': o.status,
      '总金额': o.total_amount,
      '成本': o.total_cost,
      '利润': o.profit,
      '交货日期': o.delivery_date,
      '订单日期': o.order_date,
      '备注': o.remark,
    }));
    return this.createExcel(data, '订单');
  }

  async importProducts(data: any[]): Promise<{ success: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;

    for (const row of data) {
      try {
        const product = this.productRepo.create({
          code: row['产品编号'] || row['code'],
          name: row['名称'] || row['name'],
          spec: row['规格'] || row['spec'],
          length: row['长'] || row['length'] || 0,
          width: row['宽'] || row['width'] || 0,
          height: row['高'] || row['height'] || 0,
          material: row['材质'] || row['material'] || '',
          unit: row['单位'] || row['unit'] || '个',
          unit_price: row['单价'] || row['unit_price'] || 0,
          cost: row['成本'] || row['cost'] || 0,
          stock_qty: row['库存'] || row['stock_qty'] || 0,
          safety_stock: row['安全库存'] || row['safety_stock'] || 0,
          status: row['状态'] || row['status'] || '正常生产',
        });
        await this.productRepo.save(product);
        success++;
      } catch (err: any) {
        errors.push(`行 ${data.indexOf(row) + 1}: ${err.message}`);
      }
    }

    return { success, errors };
  }

  private createExcel(data: any[], sheetName: string): Buffer {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}
