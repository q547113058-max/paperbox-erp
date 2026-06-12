import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OutsourcingOrder } from '../entities/outsourcing_orders';
import { OutsourcingEntry } from '../entities/outsourcing_entries';
import { WorkshopInventory } from '../entities/workshop_inventory';
import { WorkshopInventoryLog } from '../entities/workshop_inventory_logs';

@Injectable()
export class OutsourcingOrderService {
  constructor(
    @InjectRepository(OutsourcingOrder)
    private readonly repo: Repository<OutsourcingOrder>,
    @InjectRepository(OutsourcingEntry)
    private readonly entryRepo: Repository<OutsourcingEntry>,
    @InjectRepository(WorkshopInventory)
    private readonly workshopInvRepo: Repository<WorkshopInventory>,
    @InjectRepository(WorkshopInventoryLog)
    private readonly workshopLogRepo: Repository<WorkshopInventoryLog>,
    private readonly dataSource: DataSource,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }

  /**
   * 业务方法：创建委外单
   * POST /api/outsourcing_orders
   */
  async createOrder(data: Partial<OutsourcingOrder>) {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const orderNo = data.order_no || `OS${now.replace(/[^0-9]/g, '')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const o = this.repo.create({
      order_no: orderNo,
      work_order_id: data.work_order_id || 0,
      material_name: data.material_name || '',
      material_spec: data.material_spec || '',
      quantity: Number(data.quantity || 0),
      unit: data.unit || '个',
      supplier_id: data.supplier_id || 0,
      status: data.status || '待加工',
      planned_date: data.planned_date || '',
      completed_date: '',
      received_qty: 0,
      remark: data.remark || '',
      created_at: now,
      customer_id: data.customer_id || 0,
      size_structure: data.size_structure || '',
      paper_size: data.paper_size || '',
      machine_size: data.machine_size || '',
      machine_quantity: Number(data.machine_quantity || 0),
      finished_quantity: 0,
      print_color: data.print_color || '',
      follow_version: data.follow_version || '',
      surface_treatment: data.surface_treatment || '',
      unit_price: Number(data.unit_price || 0),
      is_settled: 0,
    });
    return this.repo.save(o);
  }

  /**
   * 业务方法：委外单完成（供应商交付）→ 自动入库
   * POST /api/outsourcing_orders/:id/complete
   * body: { received_qty: number, finished_quantity?: number }
   */
  async complete(id: number, data: { received_qty: number; finished_quantity?: number }) {
    const order = await this.repo.findOne({ where: { id } });
    if (!order) throw new NotFoundException(`委外单 ${id} 不存在`);
    if (order.status === '已完成' || order.status === '已取消') {
      throw new BadRequestException(`委外单状态 ${order.status} 不能完成`);
    }
    const qty = Number(data.received_qty || 0);
    if (qty <= 0) throw new BadRequestException('收货数量必须 > 0');

    return this.dataSource.transaction(async manager => {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      order.status = '已完成';
      order.completed_date = now;
      order.received_qty = qty;
      if (data.finished_quantity) order.finished_quantity = Number(data.finished_quantity);
      await manager.save(order);

      // 入库
      const inv = manager.create(WorkshopInventory, {
        material_name: order.material_name,
        material_spec: order.material_spec,
        material_type: '委外成品',
        quantity: qty,
        unit: order.unit,
        source_type: 'outsourcing',
        source_id: order.id,
        work_order_id: order.work_order_id,
        status: '可用',
        created_at: now,
        updated_at: now,
      });
      await manager.save(inv);

      const log = manager.create(WorkshopInventoryLog, {
        material_name: order.material_name,
        material_spec: order.material_spec,
        type: '入库',
        quantity: qty,
        ref_type: 'outsourcing_order',
        ref_id: order.id,
        work_order_id: order.work_order_id,
        remark: `委外单 ${order.order_no} 完工入库`,
        created_at: now,
      });
      await manager.save(log);

      return { order, inventory: inv };
    });
  }

  /**
   * 业务方法：委外领用出库（领料给车间）
   * POST /api/outsourcing_orders/:id/entry
   * body: { quantity: number, remark?: string }
   */
  async createEntry(id: number, data: { quantity: number; remark?: string }) {
    const order = await this.repo.findOne({ where: { id } });
    if (!order) throw new NotFoundException(`委外单 ${id} 不存在`);
    const qty = Number(data.quantity || 0);
    if (qty <= 0) throw new BadRequestException('领用数量必须 > 0');

    return this.dataSource.transaction(async manager => {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const entryNo = `OE${now.replace(/[^0-9]/g, '')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      const entry = manager.create(OutsourcingEntry, {
        entry_no: entryNo,
        outsourcing_order_id: order.id,
        work_order_id: order.work_order_id,
        material_name: order.material_name,
        quantity: qty,
        status: '已领用',
        remark: data.remark || '',
        created_at: now,
      });
      const savedEntry = await manager.save(entry);

      // 写库存日志（委外领用出库）
      const log = manager.create(WorkshopInventoryLog, {
        material_name: order.material_name,
        material_spec: order.material_spec,
        type: '出库',
        quantity: qty,
        ref_type: 'outsourcing_entry',
        ref_id: savedEntry.id,
        work_order_id: order.work_order_id,
        remark: `委外单 ${order.order_no} 领用`,
        created_at: now,
      });
      await manager.save(log);

      return savedEntry;
    });
  }

  /**
   * 业务方法：取消委外单
   */
  async cancel(id: number, data: { reason: string }) {
    const order = await this.repo.findOne({ where: { id } });
    if (!order) throw new NotFoundException(`委外单 ${id} 不存在`);
    if (order.status === '已完成') {
      throw new BadRequestException('已完成的委外单不能取消');
    }
    order.status = '已取消';
    order.remark = (order.remark || '') + ` [取消: ${data.reason || ''}]`;
    return this.repo.save(order);
  }

  /**
   * 业务方法：委外结算
   * POST /api/outsourcing_orders/:id/settle
   * body: { unit_price?: number }
   */
  async settle(id: number, data: { unit_price?: number }) {
    const order = await this.repo.findOne({ where: { id } });
    if (!order) throw new NotFoundException(`委外单 ${id} 不存在`);
    if (order.status !== '已完成') {
      throw new BadRequestException(`委外单状态 ${order.status} 不能结算`);
    }
    if (data.unit_price) order.unit_price = Number(data.unit_price);
    order.is_settled = 1;
    return this.repo.save(order);
  }

  create(data: Partial<OutsourcingOrder>) {
    return this.createOrder(data);
  }

  async update(id: number, data: Partial<OutsourcingOrder>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`outsourcing_orders ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`outsourcing_orders ${id} not found`);
    return this.repo.remove(item);
  }
}