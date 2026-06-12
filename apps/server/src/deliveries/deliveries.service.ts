import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Delivery } from '../entities/deliveries';
import { DeliveryItem } from '../entities/delivery_items';
import { Order } from '../entities/orders';
import { OrderItem } from '../entities/order_items';
import { Product } from '../entities/products';
import { WorkshopInventory } from '../entities/workshop_inventory';
import { WorkshopInventoryLog } from '../entities/workshop_inventory_logs';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private readonly repo: Repository<Delivery>,
    @InjectRepository(DeliveryItem)
    private readonly itemRepo: Repository<DeliveryItem>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(WorkshopInventory)
    private readonly workshopInvRepo: Repository<WorkshopInventory>,
    @InjectRepository(WorkshopInventoryLog)
    private readonly workshopLogRepo: Repository<WorkshopInventoryLog>,
    private readonly dataSource: DataSource,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  /**
   * 业务方法：从工单创建发货单
   * POST /api/deliveries/from-work-order
   * body: { work_order_id: number, delivery_date?, delivery_person?, address?, items?: [...] }
   *
   * 流程：工单已完成 → 自动从 workshop_inventory 领用 → 扣减库存 + 写日志
   */
  async generateFromWorkOrder(data: any) {
    const { work_order_id, delivery_date, delivery_person, address, items } = data;
    // 1. 校验工单
    const orderItem = await this.orderItemRepo.findOne({ where: { id: work_order_id } });
    // 兼容调用方传 order_id (兼容老前端)
    const order = orderItem
      ? await this.orderRepo.findOne({ where: { id: orderItem.order_id } })
      : await this.orderRepo.findOne({ where: { id: data.order_id } });
    if (!order) throw new NotFoundException('关联订单不存在');

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const deliveryNo = `DN${now.replace(/[^0-9]/g, '')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    return this.dataSource.transaction(async manager => {
      // 2. 拉取订单明细作为发货明细（如果未传 items）
      let deliveryItems = items;
      if (!deliveryItems || deliveryItems.length === 0) {
        const orderItems = await manager.find(OrderItem, { where: { order_id: order.id } });
        deliveryItems = orderItems.map((oi: OrderItem) => ({
          product_id: oi.product_id,
          quantity: oi.quantity,
          unit_price: oi.unit_price,
          remark: '',
        }));
      }
      if (!deliveryItems || deliveryItems.length === 0) {
        throw new BadRequestException('无可发货明细');
      }

      // 3. 校验库存并扣减
      const deductedItems: any[] = [];
      for (const it of deliveryItems) {
        // workshop_inventory 表没有 product_id 字段，按 material_name 关联
        // 简化处理：用 QueryBuilder 通过 material_name 查库存
        const inventory = await manager
          .createQueryBuilder(WorkshopInventory, 'wi')
          .where('wi.source_type = :t AND wi.status = :s', { t: 'work_order', s: '可用' })
          .andWhere('wi.material_name = (SELECT name FROM products WHERE id = :pid)', { pid: it.product_id })
          .getOne();

        if (inventory) {
          if (inventory.quantity < it.quantity) {
            throw new BadRequestException(
              `产品 #${it.product_id} 库存不足（库存 ${inventory.quantity}, 发货 ${it.quantity}）`,
            );
          }
          inventory.quantity -= it.quantity;
          if (inventory.quantity <= 0) {
            inventory.status = '已用完';
          }
          await manager.save(inventory);

          // 写库存日志
          const log = manager.create(WorkshopInventoryLog, {
            material_name: inventory.material_name,
            material_spec: inventory.material_spec,
            type: '出库',
            quantity: it.quantity,
            ref_type: 'delivery',
            ref_id: 0, // 后置更新
            work_order_id: inventory.work_order_id,
            remark: `发货单领用`,
            created_at: now,
          });
          await manager.save(log);
        }

        deductedItems.push({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.unit_price || 0,
          remark: it.remark || '',
        });
      }

      // 4. 创建发货单
      const delivery = manager.create(Delivery, {
        delivery_no: deliveryNo,
        order_id: order.id,
        customer_id: order.customer_id,
        work_order_id: work_order_id || 0,
        work_order_completed_at: now,
        status: '待发货',
        delivery_date: delivery_date || '',
        signed: 0,
        signed_at: '',
        remark: '',
        created_at: now,
        delivery_person: delivery_person || '',
        delivery_time: '',
        warehouse_entry_id: 0,
        address: address || '',
        work_order_nos: '',
      });
      const savedDelivery = await manager.save(delivery);

      // 5. 创建发货明细
      const savedItems: DeliveryItem[] = [];
      for (const it of deductedItems) {
        const di = manager.create(DeliveryItem, {
          delivery_id: savedDelivery.id,
          product_id: it.product_id,
          quantity: it.quantity,
          warehouse_entry_id: 0,
          unit_price: it.unit_price,
          remark: it.remark,
        });
        const saved = await manager.save(di);
        savedItems.push(saved);
      }

      return { delivery: savedDelivery, items: savedItems };
    });
  }

  /**
   * 业务方法：发货单 → 已发货
   * PUT /api/deliveries/:id/ship
   * body: { delivery_person, delivery_time }
   */
  async ship(id: number, data: { delivery_person?: string; delivery_time?: string }) {
    const delivery = await this.repo.findOne({ where: { id } });
    if (!delivery) throw new NotFoundException(`发货单 ${id} 不存在`);
    if (delivery.status !== '待发货') {
      throw new BadRequestException(`发货单状态 ${delivery.status} 不能发货`);
    }
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    delivery.status = '已发货';
    delivery.delivery_person = data.delivery_person || delivery.delivery_person;
    delivery.delivery_time = data.delivery_time || now;
    const saved = await this.repo.save(delivery);

    // 更新关联订单的发货进度
    const items = await this.itemRepo.find({ where: { delivery_id: id } });
    for (const it of items) {
      const oi = await this.orderItemRepo.findOne({ where: { order_id: delivery.order_id, product_id: it.product_id } });
      if (oi) {
        oi.delivered_qty = (oi.delivered_qty || 0) + it.quantity;
        await this.orderItemRepo.save(oi);
      }
    }

    return saved;
  }

  /**
   * 业务方法：签收
   * POST /api/deliveries/:id/sign
   */
  async sign(id: number, data: { remark?: string }) {
    const delivery = await this.repo.findOne({ where: { id } });
    if (!delivery) throw new NotFoundException(`发货单 ${id} 不存在`);
    if (delivery.status !== '已发货') {
      throw new BadRequestException(`发货单状态 ${delivery.status} 不能签收`);
    }
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    delivery.status = '已签收';
    delivery.signed = 1;
    delivery.signed_at = now;
    if (data.remark) delivery.remark = (delivery.remark || '') + ` [签收: ${data.remark}]`;
    const saved = await this.repo.save(delivery);

    // 检查订单是否全部签收 → 更新订单状态
    const allDeliveries = await this.repo.find({ where: { order_id: delivery.order_id } });
    const allSigned = allDeliveries.every(d => d.signed === 1);
    if (allSigned && allDeliveries.length > 0) {
      await this.orderRepo.update(delivery.order_id, { status: '已发货' } as any);
    }

    return saved;
  }

  /**
   * 业务方法：批量发货（一次创建多个发货单）
   * POST /api/deliveries/batch-ship
   * body: { order_ids: number[], delivery_person, address }
   */
  async batchShip(data: { order_ids: number[]; delivery_person?: string; address?: string }) {
    if (!data.order_ids || data.order_ids.length === 0) {
      throw new BadRequestException('order_ids 不能为空');
    }
    const results: any[] = [];
    const errors: any[] = [];
    for (const orderId of data.order_ids) {
      try {
        const r = await this.generateFromWorkOrder({
          work_order_id: 0,
          order_id: orderId,
          delivery_person: data.delivery_person,
          address: data.address,
        });
        const shipped = await this.ship(r.delivery.id, {
          delivery_person: data.delivery_person,
        });
        results.push({ order_id: orderId, delivery: shipped });
      } catch (e: any) {
        errors.push({ order_id: orderId, error: e.message });
      }
    }
    return { success: results.length, errors, results };
  }

  /**
   * 业务方法：按发货单号查询
   * GET /api/deliveries/by-no/:no
   */
  async findByNo(deliveryNo: string) {
    const d = await this.repo.findOne({ where: { delivery_no: deliveryNo } });
    if (!d) throw new NotFoundException(`发货单 ${deliveryNo} 不存在`);
    const items = await this.itemRepo.find({ where: { delivery_id: d.id } });
    return { ...d, items };
  }

  create(data: Partial<Delivery>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Delivery>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`deliveries ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`deliveries ${id} not found`);
    return this.repo.remove(item);
  }

  // ========== 补充：从订单直接创建发货单（旧系统 deliveries/from-order） ==========

  /**
   * 从订单直接生成发货单（不经过工单/进仓单）
   * POST /api/deliveries/from-order
   * body: { order_id, items: [{ product_id, quantity }], delivery_date?, address?, remark? }
   */
  async generateFromOrder(data: any) {
    const { order_id, items, delivery_date, address, remark } = data;
    const order = await this.orderRepo.findOne({ where: { id: order_id } });
    if (!order) throw new NotFoundException('订单不存在');
    if (!items || items.length === 0) throw new BadRequestException('发货明细不能为空');

    return this.dataSource.transaction(async manager => {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const deliveryNo = `DN${Date.now()}`;

      const delivery = manager.create(Delivery, {
        delivery_no: deliveryNo,
        order_id,
        customer_id: order.customer_id || 0,
        work_order_id: 0,
        delivery_date: delivery_date || now.slice(0, 10),
        address: address || '',
        status: '待发货',
        remark: remark || `从订单 ${order.order_no} 生成`,
        created_at: now,
      });
      const saved = await manager.save(delivery);

      for (const item of items) {
        const di = manager.create(DeliveryItem, {
          delivery_id: saved.id,
          product_id: item.product_id,
          quantity: item.quantity || 0,
          warehouse_entry_id: 0,
        });
        await manager.save(di);

        // 扣减产品库存
        if (item.product_id && item.quantity > 0) {
          await manager
            .createQueryBuilder()
            .update(Product)
            .set({ stock_qty: () => `stock_qty - ${item.quantity}` })
            .where('id = :id', { id: item.product_id })
            .execute();
        }
      }

      return { success: true, delivery_id: saved.id, delivery_no: deliveryNo };
    });
  }
}