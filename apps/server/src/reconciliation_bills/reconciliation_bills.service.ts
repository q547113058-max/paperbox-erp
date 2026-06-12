import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ReconciliationBill } from '../entities/reconciliation_bills';
import { ReconciliationItem } from '../entities/reconciliation_items';
import { Delivery } from '../entities/deliveries';
import { DeliveryItem } from '../entities/delivery_items';
import { Customer } from '../entities/customers';

@Injectable()
export class ReconciliationBillService {
  constructor(
    @InjectRepository(ReconciliationBill)
    private readonly repo: Repository<ReconciliationBill>,
    @InjectRepository(ReconciliationItem)
    private readonly itemRepo: Repository<ReconciliationItem>,
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
    @InjectRepository(DeliveryItem)
    private readonly deliveryItemRepo: Repository<DeliveryItem>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly dataSource: DataSource,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }

  /**
   * 业务方法：生成客户对账单
   * POST /api/reconciliation_bills/generate
   * body: { customer_id, period_start, period_end }
   *
   * 流程：拉取指定客户在时间段内 已签收 的发货单 → 生成对账单 + 明细
   */
  async generate(data: { customer_id: number; period_start: string; period_end: string; remark?: string }) {
    if (!data.customer_id) throw new BadRequestException('customer_id 必填');
    if (!data.period_start || !data.period_end) {
      throw new BadRequestException('period_start / period_end 必填');
    }
    const customer = await this.customerRepo.findOne({ where: { id: data.customer_id } });
    if (!customer) throw new NotFoundException('客户不存在');

    // 拉取时间区间内 已签收 的发货单
    const deliveries = await this.deliveryRepo
      .createQueryBuilder('d')
      .where('d.customer_id = :cid', { cid: data.customer_id })
      .andWhere('d.status = :s', { s: '已签收' })
      .andWhere('d.signed_at >= :start AND d.signed_at <= :end', {
        start: data.period_start,
        end: data.period_end,
      })
      .getMany();

    if (deliveries.length === 0) {
      throw new BadRequestException('该客户在指定时间段内无已签收的发货单');
    }

    return this.dataSource.transaction(async manager => {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const billNo = `RB${now.replace(/[^0-9]/g, '')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      const items: ReconciliationItem[] = [];
      let totalAmount = 0;
      let totalQty = 0;

      for (const d of deliveries) {
        const dItems = await manager.find(DeliveryItem, { where: { delivery_id: d.id } });
        for (const di of dItems) {
          const amount = (di.quantity || 0) * (di.unit_price || 0);
          totalAmount += amount;
          totalQty += di.quantity || 0;

          const ri = manager.create(ReconciliationItem, {
            bill_id: 0, // 后置更新
            delivery_id: d.id,
            delivery_no: d.delivery_no,
            product_name: `产品#${di.product_id}`,
            quantity: di.quantity,
            unit_price: di.unit_price,
            amount,
            delivery_date: d.delivery_date,
            created_at: now,
          });
          const saved = await manager.save(ri);
          items.push(saved);
        }
      }

      const bill = manager.create(ReconciliationBill, {
        bill_no: billNo,
        customer_id: data.customer_id,
        period_start: data.period_start,
        period_end: data.period_end,
        total_amount: totalAmount,
        total_qty: totalQty,
        status: '待确认',
        confirmed_at: '',
        remark: data.remark || `客户：${customer.name}`,
        created_at: now,
      });
      const savedBill = await manager.save(bill);

      // 回填 bill_id
      for (const it of items) {
        it.bill_id = savedBill.id;
        await manager.save(it);
      }

      return { ...savedBill, items };
    });
  }

  /**
   * 业务方法：确认对账单
   * POST /api/reconciliation_bills/:id/confirm
   */
  async confirm(id: number, data: { remark?: string }) {
    const bill = await this.repo.findOne({ where: { id } });
    if (!bill) throw new NotFoundException(`对账单 ${id} 不存在`);
    if (bill.status !== '待确认') {
      throw new BadRequestException(`对账单状态 ${bill.status} 不能确认`);
    }
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    bill.status = '已确认';
    bill.confirmed_at = now;
    if (data.remark) bill.remark = (bill.remark || '') + ` [确认: ${data.remark}]`;
    return this.repo.save(bill);
  }

  /**
   * 业务方法：取消对账单
   */
  async cancel(id: number, data: { reason: string }) {
    const bill = await this.repo.findOne({ where: { id } });
    if (!bill) throw new NotFoundException(`对账单 ${id} 不存在`);
    if (bill.status === '已确认') {
      throw new BadRequestException('已确认的对账单不能直接取消，需先冲正');
    }
    bill.status = '已取消';
    bill.remark = (bill.remark || '') + ` [取消: ${data.reason || ''}]`;
    return this.repo.save(bill);
  }

  create(data: Partial<ReconciliationBill>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<ReconciliationBill>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`reconciliation_bills ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`reconciliation_bills ${id} not found`);
    await this.itemRepo.delete({ bill_id: id });
    return this.repo.remove(item);
  }
}