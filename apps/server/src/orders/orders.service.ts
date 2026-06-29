import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/orders';
import { OrderItem } from '../entities/order_items';
import { Customer } from '../entities/customers';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  findAll() {
    return this.orderRepo.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    const items = await this.itemRepo.find({ where: { order_id: id } });
    return { ...order, items };
  }

  async create(data: any) {
    // 支持两种格式：{ order: {...}, items: [...] } 或扁平 { order_no: '...', ... }
    const orderData = data.order || data;
    const items = data.items || [];
    // 自动生成 order_no（如果未提供）
    if (!orderData.order_no) {
      const ts = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      orderData.order_no = `SO${ts}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }
    const entity = this.orderRepo.create(orderData as Order);
    const saved = await this.orderRepo.save(entity);
    const savedItems = await Promise.all(
      items.map((item: any) => {
        const e = this.itemRepo.create({ ...item, order_id: saved.id } as OrderItem);
        return this.itemRepo.save(e);
      })
    );
    return { ...saved, items: savedItems };
  }

  async update(id: number, data: { order?: Partial<Order>; items?: Partial<OrderItem>[] }) {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException(`Order ${id} not found`);
    const { order: orderData, items } = data;
    if (orderData) {
      await this.orderRepo.update(id, orderData as Partial<Order>);
    }
    if (items) {
      await this.itemRepo.delete({ order_id: id });
      await Promise.all(
        items.map(item => {
          const e = this.itemRepo.create({ ...item, order_id: id } as OrderItem);
          return this.itemRepo.save(e);
        })
      );
    }
    return this.findOne(id);
  }

  async updateStatus(id: number, status: string) {
    await this.orderRepo.update(id, { status } as any);
    return this.findOne(id);
  }

  async remove(id: number) {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException(`Order ${id} not found`);
    await this.itemRepo.delete({ order_id: id });
    await this.orderRepo.delete(id);
    return { deleted: true };
  }

  // ========== 补充：手动结单（旧系统 order-items/:id/manual-close） ==========

  /**
   * 手动结单（更新订单明细已发货数量）
   * PUT /api/orders/items/:id/manual-close
   */
  async manualCloseItem(itemId: number, data: { delivered_qty: number }) {
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException(`订单明细 ${itemId} 不存在`);
    item.delivered_qty = data.delivered_qty || item.quantity || 0;
    await this.itemRepo.save(item);
    return { success: true };
  }
}
