import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WorkOrder } from '../entities/work_orders';
import { Order } from '../entities/orders';
import { OrderItem } from '../entities/order_items';
import { Product } from '../entities/products';
import { WorkshopInventory } from '../entities/workshop_inventory';
import { WorkshopInventoryLog } from '../entities/workshop_inventory_logs';
import { OutsourcingOrder } from '../entities/outsourcing_orders';
import { OutsourcingEntry } from '../entities/outsourcing_entries';
import { WarehouseEntry } from '../entities/warehouse_entries';
import { StockLog } from '../entities/stock_logs';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly repo: Repository<WorkOrder>,
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
    @InjectRepository(OutsourcingOrder)
    private readonly outsourcingRepo: Repository<OutsourcingOrder>,
    @InjectRepository(OutsourcingEntry)
    private readonly outsourcingEntryRepo: Repository<OutsourcingEntry>,
    @InjectRepository(WarehouseEntry)
    private readonly warehouseEntryRepo: Repository<WarehouseEntry>,
    @InjectRepository(StockLog)
    private readonly stockLogRepo: Repository<StockLog>,
    private readonly dataSource: DataSource,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  /**
   * 业务方法：从订单的明细自动生成工单
   * POST /api/work_orders/from-order
   * body: { order_id: number, items?: [{ product_id, quantity }] }
   *
   * 流程：订单待确认/已确认状态 → 自动为每个产品生成一条工单
   * 工单号自动生成（WO + 时间戳），关联订单 + 产品
   */
  async generateFromOrder(data: { order_id: number; items?: any[] }) {
    const { order_id, items } = data;
    const order = await this.orderRepo.findOne({ where: { id: order_id } });
    if (!order) throw new NotFoundException(`订单 ${order_id} 不存在`);

    // 拉订单明细（如果未传 items）
    let orderItems = items;
    if (!orderItems || orderItems.length === 0) {
      orderItems = await this.orderItemRepo.find({ where: { order_id } });
    }
    if (!orderItems || orderItems.length === 0) {
      throw new BadRequestException('订单无明细，无法生成工单');
    }

    const created: WorkOrder[] = [];
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    for (const item of orderItems) {
      const product = await this.productRepo.findOne({ where: { id: item.product_id } });
      if (!product) continue;

      // 跳过已存在工单的明细
      const existing = await this.repo.findOne({
        where: { order_id, product_id: item.product_id },
      });
      if (existing) continue;

      const prodNo = `WO${Date.now()}${String(created.length + 1).padStart(2, '0')}`;
      const wo = this.repo.create({
        prod_no: prodNo,
        order_id,
        product_id: item.product_id,
        quantity: item.quantity || 0,
        material_type: product.material || '瓦楞',
        box_type: product.box_type || '平口箱',
        board_length: product.length || 0,
        board_width: product.width || 0,
        board_area: (product.length || 0) * (product.width || 0) * (item.quantity || 0) / 1000000,
        labor_hours: 0,
        processes: product.processing || '',
        status: '待排产',
        priority: 'normal',
        worker: '',
        start_time: '',
        end_time: '',
        completed_qty: 0,
        materials_json: '',
        created_at: now,
        entry_code: '',
        finished_spec: product.finished_spec || product.spec || '',
      });
      const saved = await this.repo.save(wo);
      created.push(saved);
    }

    // 订单状态推进：从 待确认 → 已确认
    if (order.status === '待确认') {
      await this.orderRepo.update(order_id, { status: '已确认' } as any);
    }

    return { created_count: created.length, work_orders: created };
  }

  /**
   * 业务方法：工单排产（指派工人 + 计划时间）
   * PUT /api/work_orders/:id/schedule
   */
  async schedule(id: number, data: { worker: string; start_time: string; end_time: string; priority?: string }) {
    const wo = await this.repo.findOne({ where: { id } });
    if (!wo) throw new NotFoundException(`工单 ${id} 不存在`);
    if (wo.status !== '待排产') {
      throw new BadRequestException(`工单状态 ${wo.status} 不能排产`);
    }
    Object.assign(wo, {
      worker: data.worker || wo.worker,
      start_time: data.start_time || wo.start_time,
      end_time: data.end_time || wo.end_time,
      priority: data.priority || wo.priority,
      status: '已排产',
    });
    return this.repo.save(wo);
  }

  /**
   * 业务方法：工单开始生产
   * PUT /api/work_orders/:id/start
   */
  async start(id: number) {
    const wo = await this.repo.findOne({ where: { id } });
    if (!wo) throw new NotFoundException(`工单 ${id} 不存在`);
    if (wo.status !== '已排产') {
      throw new BadRequestException(`工单状态 ${wo.status} 不能开始`);
    }
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    wo.status = '生产中';
    if (!wo.start_time) wo.start_time = now;
    return this.repo.save(wo);
  }

  /**
   * 业务方法：工单完工（生产完成 → 入库到车间库存）
   * POST /api/work_orders/:id/complete
   * body: { completed_qty: number, entry_code?: string }
   *
   * 流程：工单完工 → 更新 completed_qty → 写入 workshop_inventory → 记 workshop_inventory_logs
   */
  async complete(id: number, data: { completed_qty: number; entry_code?: string; remark?: string }) {
    const wo = await this.repo.findOne({ where: { id } });
    if (!wo) throw new NotFoundException(`工单 ${id} 不存在`);
    if (wo.status !== '生产中' && wo.status !== '已排产') {
      throw new BadRequestException(`工单状态 ${wo.status} 不能完工`);
    }
    const qty = Number(data.completed_qty || wo.quantity || 0);
    if (qty <= 0) throw new BadRequestException('完工数量必须 > 0');

    return this.dataSource.transaction(async manager => {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const product = await manager.findOne(Product, { where: { id: wo.product_id } });

      // 1. 更新工单状态
      wo.completed_qty = qty;
      wo.status = '已完成';
      wo.end_time = now;
      if (data.entry_code) wo.entry_code = data.entry_code;
      await manager.save(wo);

      // 2. 入库到车间库存
      const inv = manager.create(WorkshopInventory, {
        material_name: product?.name || `产品#${wo.product_id}`,
        material_spec: product?.spec || '',
        material_type: '成品',
        quantity: qty,
        unit: product?.unit || '个',
        source_type: 'work_order',
        source_id: wo.id,
        work_order_id: wo.id,
        status: '可用',
        created_at: now,
        updated_at: now,
      });
      await manager.save(inv);

      // 3. 写库存日志
      const log = manager.create(WorkshopInventoryLog, {
        material_name: product?.name || `产品#${wo.product_id}`,
        material_spec: product?.spec || '',
        type: '入库',
        quantity: qty,
        ref_type: 'work_order',
        ref_id: wo.id,
        work_order_id: wo.id,
        remark: data.remark || `工单 ${wo.prod_no} 完工入库`,
        created_at: now,
      });
      await manager.save(log);

      return { work_order: wo, inventory: inv, log };
    });
  }

  /**
   * 业务方法：取消工单
   * POST /api/work_orders/:id/cancel
   */
  async cancel(id: number, data: { reason: string }) {
    const wo = await this.repo.findOne({ where: { id } });
    if (!wo) throw new NotFoundException(`工单 ${id} 不存在`);
    if (wo.status === '已完成' || wo.status === '已取消') {
      throw new BadRequestException(`工单状态 ${wo.status} 不能取消`);
    }
    wo.status = '已取消';
    // work_orders 表没有 remark 字段，复用 entry_code 存取消原因
    wo.entry_code = (wo.entry_code || '') + `[取消:${data.reason || ''}]`;
    return this.repo.save(wo);
  }

  create(data: Partial<WorkOrder>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<WorkOrder>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`work_orders ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`work_orders ${id} not found`);
    return this.repo.remove(item);
  }

  // ========== 补充业务方法（旧系统已有，新系统缺失） ==========

  /**
   * 从产品直接生成工单（不经过订单）
   * POST /api/work-orders/from-product
   * body: { product_id, quantity, priority? }
   */
  async generateFromProduct(data: { product_id: number; quantity: number; priority?: string }) {
    const { product_id, quantity, priority } = data;
    const product = await this.productRepo.findOne({ where: { id: product_id } });
    if (!product) throw new NotFoundException('产品不存在');
    if (quantity <= 0) throw new BadRequestException('数量必须大于0');

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const prodNo = `WO${Date.now()}`;

    const wo = this.repo.create({
      prod_no: prodNo,
      order_id: 0,
      product_id,
      quantity,
      material_type: product.material || '瓦楞',
      box_type: product.box_type || '平口箱',
      board_length: product.length || 0,
      board_width: product.width || 0,
      board_area: (product.length || 0) * (product.width || 0) * quantity / 1000000,
      labor_hours: 0,
      processes: product.processing || '',
      status: '待排产',
      priority: priority || 'normal',
      worker: '',
      start_time: '',
      end_time: '',
      completed_qty: 0,
      materials_json: '',
      created_at: now,
      entry_code: '',
      finished_spec: product.finished_spec || product.spec || '',
    });

    const saved = await this.repo.save(wo);
    return { success: true, id: saved.id, prod_no: prodNo };
  }

  /**
   * 部分完成工单（累加完成数量，自动创建进仓单）
   * POST /api/work-orders/:id/partial-complete
   * body: { completed_qty }
   */
  async partialComplete(id: number, data: { completed_qty: number }) {
    const wo = await this.repo.findOne({ where: { id } });
    if (!wo) throw new NotFoundException('工单不存在');
    if (data.completed_qty <= 0) throw new BadRequestException('完成数量必须大于0');
    if (data.completed_qty > (wo.quantity || 0)) throw new BadRequestException('完成数量不能超过计划数量');

    const newCompletedQty = (wo.completed_qty || 0) + data.completed_qty;
    const newStatus = newCompletedQty >= (wo.quantity || 0) ? '已完成' : '部分完成';
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    return this.dataSource.transaction(async manager => {
      // 更新工单
      wo.completed_qty = newCompletedQty;
      wo.status = newStatus;
      if (!wo.start_time) wo.start_time = now;
      if (newStatus === '已完成') wo.end_time = now;
      await manager.save(wo);

      // 自动创建进仓单（如果新完成数量 > 已进仓数量）
      const existingEntries = await manager
        .createQueryBuilder(WarehouseEntry, 'we')
        .select('COALESCE(SUM(we.quantity), 0)', 'total')
        .where('we.work_order_id = :woId', { woId: id })
        .andWhere('we.status != :cancel', { cancel: '已取消' })
        .getRawOne();
      const alreadyEntered = Number(existingEntries?.total) || 0;
      const enterableQty = newCompletedQty - alreadyEntered;

      let warehouseEntry: any = null;
      if (enterableQty > 0) {
        const entryNo = `WE${Date.now()}`;
        const product = wo.product_id ? await manager.findOne(Product, { where: { id: wo.product_id } }) : null;

        const entry = manager.create(WarehouseEntry, {
          entry_no: entryNo,
          work_order_id: wo.id,
          order_id: wo.order_id,
          product_id: wo.product_id,
          product_name: product?.name || '',
          quantity: enterableQty,
          status: '待发货',
          remark: '工单完工自动创建',
          created_at: now,
        });
        await manager.save(entry);

        // 更新产品库存
        if (wo.product_id) {
          await manager
            .createQueryBuilder()
            .update(Product)
            .set({ stock_qty: () => `stock_qty + ${enterableQty}` })
            .where('id = :pid', { pid: wo.product_id })
            .execute();

          const log = manager.create(StockLog, {
            product_id: wo.product_id,
            type: '入库',
            quantity: enterableQty,
            ref_no: entryNo,
            remark: '进仓单入库',
            created_at: now,
          });
          await manager.save(log);
        }

        warehouseEntry = { id: entry.id, entry_no: entryNo, quantity: enterableQty };
      }

      return {
        success: true,
        completed_qty: newCompletedQty,
        status: newStatus,
        warehouse_entry: warehouseEntry,
        message: warehouseEntry
          ? `已记录 ${data.completed_qty} 件完成，累计 ${newCompletedQty}/${wo.quantity}，已自动创建进仓单 ${warehouseEntry.entry_no}`
          : `已记录 ${data.completed_qty} 件完成，累计 ${newCompletedQty}/${wo.quantity}`,
      };
    });
  }

  /**
   * 批量生成工单（从多个订单）
   * POST /api/work-orders/batch-from-orders
   * body: { order_ids: number[] }
   */
  async batchFromOrders(data: { order_ids: number[] }) {
    const { order_ids } = data;
    if (!order_ids || order_ids.length === 0) throw new BadRequestException('请选择订单');

    const results: any[] = [];
    for (const orderId of order_ids) {
      const order = await this.orderRepo.findOne({ where: { id: orderId } });
      if (!order) continue;

      const orderItems = await this.orderItemRepo.find({ where: { order_id: orderId } });
      for (const item of orderItems) {
        const product = await this.productRepo.findOne({ where: { id: item.product_id } });
        if (!product) continue;

        const existing = await this.repo.findOne({ where: { order_id: orderId, product_id: item.product_id } });
        if (existing) continue;

        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
        const prodNo = `WO${Date.now()}${String(results.length + 1).padStart(2, '0')}`;

        const wo = this.repo.create({
          prod_no: prodNo,
          order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity || 0,
          material_type: product.material || '瓦楞',
          box_type: product.box_type || '平口箱',
          board_length: product.length || 0,
          board_width: product.width || 0,
          board_area: (product.length || 0) * (product.width || 0) * (item.quantity || 0) / 1000000,
          labor_hours: 0,
          processes: product.processing || '',
          status: '待排产',
          priority: 'normal',
          worker: '',
          start_time: '',
          end_time: '',
          completed_qty: 0,
          materials_json: '',
          created_at: now,
          entry_code: '',
          finished_spec: product.finished_spec || product.spec || '',
        });
        const saved = await this.repo.save(wo);
        results.push({ order_id: orderId, prod_no: prodNo, product: product.name });
      }

      // 订单状态推进
      if (order.status === '待确认') {
        await this.orderRepo.update(orderId, { status: '已确认' } as any);
      }
    }

    return { success: true, message: `成功创建 ${results.length} 个工单`, results };
  }

  /**
   * 获取工单物料列表
   * GET /api/work-orders/:id/materials
   */
  async getMaterials(id: number) {
    const wo = await this.repo.findOne({ where: { id } });
    if (!wo) throw new NotFoundException('工单不存在');
    const materials = JSON.parse(wo.materials_json || '[]');
    return { work_order: wo, materials };
  }
}