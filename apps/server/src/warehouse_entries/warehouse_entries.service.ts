import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WarehouseEntry } from '../entities/warehouse_entries';
import { WorkOrder } from '../entities/work_orders';
import { Product } from '../entities/products';
import { Delivery } from '../entities/deliveries';
import { DeliveryItem } from '../entities/delivery_items';
import { StockLog } from '../entities/stock_logs';

@Injectable()
export class WarehouseEntriesService {
  constructor(
    @InjectRepository(WarehouseEntry)
    private readonly repo: Repository<WarehouseEntry>,
    @InjectRepository(WorkOrder)
    private readonly workOrderRepo: Repository<WorkOrder>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
    @InjectRepository(DeliveryItem)
    private readonly deliveryItemRepo: Repository<DeliveryItem>,
    @InjectRepository(StockLog)
    private readonly stockLogRepo: Repository<StockLog>,
    private readonly dataSource: DataSource,
  ) {}

  // ========== 基础 CRUD ==========

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<WarehouseEntry>) {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return this.repo.save(this.repo.create({ ...data, created_at: now }));
  }

  async update(id: number, data: Partial<WarehouseEntry>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`warehouse_entries ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`warehouse_entries ${id} not found`);
    return this.repo.remove(item);
  }

  // ========== 业务方法 ==========

  /**
   * 从工单创建进仓单（支持部分进仓）
   * POST /api/warehouse-entries/from-workorder
   */
  async fromWorkOrder(data: { work_order_id: number; quantity: number; remark?: string }) {
    const { work_order_id, quantity, remark } = data;

    const workOrder = await this.workOrderRepo.findOne({ where: { id: work_order_id } });
    if (!workOrder) throw new NotFoundException('工单不存在');
    if (workOrder.status !== '生产中' && workOrder.status !== '已完成' && workOrder.status !== '已排产') {
      throw new BadRequestException('工单未在生产或已完成状态');
    }
    if (quantity <= 0) throw new BadRequestException('进仓数量必须大于0');

    return this.dataSource.transaction(async manager => {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

      // 计算已进仓数量
      const existingEntries = await manager
        .createQueryBuilder(WarehouseEntry, 'we')
        .select('COALESCE(SUM(we.quantity), 0)', 'total')
        .where('we.work_order_id = :woId', { woId: work_order_id })
        .andWhere('we.status != :cancel', { cancel: '已取消' })
        .getRawOne();
      const alreadyEntered = Number(existingEntries?.total) || 0;
      const remainingQty = (workOrder.completed_qty || 0) - alreadyEntered;

      if (quantity > remainingQty) {
        throw new BadRequestException(`进仓数量超出可进仓范围，剩余可进仓: ${remainingQty}`);
      }

      // 生成进仓单号
      const entryNo = await this.generateNo('WE');

      // 获取产品信息
      const product = workOrder.product_id
        ? await manager.findOne(Product, { where: { id: workOrder.product_id } })
        : null;

      // 创建进仓单
      const entry = manager.create(WarehouseEntry, {
        entry_no: entryNo,
        work_order_id: workOrder.id,
        order_id: workOrder.order_id,
        product_id: workOrder.product_id,
        product_name: product?.name || '',
        quantity,
        status: '待发货',
        remark: remark || '',
        created_at: now,
      });
      await manager.save(entry);

      // 更新产品库存
      if (workOrder.product_id) {
        await manager.query(
          'UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?',
          [quantity, workOrder.product_id],
        );

        // 写库存变动日志
        const log = manager.create(StockLog, {
          product_id: workOrder.product_id,
          type: '入库',
          quantity,
          ref_no: entryNo,
          remark: '进仓单入库',
          created_at: now,
        });
        await manager.save(log);
      }

      return { success: true, id: entry.id, entry_no: entryNo, message: `进仓单 ${entryNo} 创建成功` };
    });
  }

  /**
   * 通过进仓码扫码查找工单信息
   * GET /api/warehouse-entries/lookup/:entryCode
   */
  async lookupByCode(entryCode: string) {
    const wo = await this.workOrderRepo.findOne({ where: { entry_code: entryCode } });
    if (!wo) throw new NotFoundException('进仓码无效，未找到对应工单');

    // 计算已进仓数量
    const result = await this.repo
      .createQueryBuilder('we')
      .select('COALESCE(SUM(we.quantity), 0)', 'total')
      .where('we.work_order_id = :woId', { woId: wo.id })
      .andWhere('we.status != :cancel', { cancel: '已取消' })
      .getRawOne();
    const alreadyEntered = Number(result?.total) || 0;
    const remainingQty = Math.max(0, (wo.quantity || 0) - alreadyEntered);

    // 获取产品和订单信息
    const product = wo.product_id ? await this.productRepo.findOne({ where: { id: wo.product_id } }) : null;

    return {
      work_order: { ...wo, product_name: product?.name, product_code: product?.code },
      already_entered: alreadyEntered,
      remaining_qty: remainingQty,
    };
  }

  /**
   * 通过进仓码扫码创建进仓单
   * POST /api/warehouse-entries/by-code
   */
  async byCode(data: { entry_code: string; quantity: number; remark?: string }) {
    const { entry_code, quantity, remark } = data;
    if (!entry_code || !quantity) throw new BadRequestException('进仓码和数量不能为空');

    const wo = await this.workOrderRepo.findOne({ where: { entry_code } });
    if (!wo) throw new NotFoundException('进仓码无效');
    if (!['生产中', '已完成', '部分完成', '已排产'].includes(wo.status)) {
      throw new BadRequestException('工单未在生产或已完成状态');
    }

    return this.dataSource.transaction(async manager => {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const entryNo = await this.generateNo('WE');
      const product = wo.product_id ? await manager.findOne(Product, { where: { id: wo.product_id } }) : null;

      // 创建进仓单
      const entry = manager.create(WarehouseEntry, {
        entry_no: entryNo,
        work_order_id: wo.id,
        order_id: wo.order_id,
        product_id: wo.product_id,
        product_name: product?.name || '',
        quantity,
        status: '待发货',
        remark: remark || `扫码进仓 - 码:${entry_code}`,
        created_at: now,
      });
      await manager.save(entry);

      // 更新产品库存
      if (wo.product_id) {
        await manager.query(
          'UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?',
          [quantity, wo.product_id],
        );

        const log = manager.create(StockLog, {
          product_id: wo.product_id,
          type: '入库',
          quantity,
          ref_no: entryNo,
          remark: '扫码进仓',
          created_at: now,
        });
        await manager.save(log);
      }

      // 进仓后自动将工单改为已完成
      wo.status = '已完成';
      wo.completed_qty = quantity;
      wo.end_time = now;
      await manager.save(wo);

      return {
        success: true,
        id: entry.id,
        entry_no: entryNo,
        work_order_no: wo.prod_no,
        product_name: product?.name,
        quantity,
        message: `进仓单 ${entryNo} 创建成功`,
      };
    });
  }

  /**
   * 更新进仓单状态
   * PUT /api/warehouse-entries/:id/status
   */
  async updateStatus(id: number, status: string) {
    const validStatuses = ['待发货', '部分发货', '已发货', '已取消'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('无效的状态');
    }
    const entry = await this.findOne(id);
    if (!entry) throw new NotFoundException('进仓单不存在');
    entry.status = status;
    await this.repo.save(entry);
    return { success: true };
  }

  /**
   * 从进仓单创建送货单
   * POST /api/warehouse-entries/:id/create-delivery
   */
  async createDelivery(id: number, data: { delivery_date?: string; address?: string; remark?: string }) {
    const entry = await this.repo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('进仓单不存在');

    return this.dataSource.transaction(async manager => {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

      // 计算已发货数量
      const existingDeliveries = await manager
        .createQueryBuilder(DeliveryItem, 'di')
        .innerJoin(Delivery, 'd', 'd.id = di.delivery_id')
        .select('COALESCE(SUM(di.quantity), 0)', 'total')
        .where('di.warehouse_entry_id = :entryId', { entryId: id })
        .andWhere('d.status != :cancel', { cancel: '已取消' })
        .getRawOne();
      const alreadyDelivered = Number(existingDeliveries?.total) || 0;
      const remainingQty = (entry.quantity || 0) - alreadyDelivered;

      if (remainingQty <= 0) throw new BadRequestException('该进仓单已全部发货');

      // 获取关联信息
      const wo = entry.work_order_id ? await manager.findOne(WorkOrder, { where: { id: entry.work_order_id } }) : null;

      // 生成送货单号
      const deliveryNo = await this.generateNo('DN');

      // 创建送货单
      const delivery = manager.create(Delivery, {
        delivery_no: deliveryNo,
        order_id: entry.order_id,
        customer_id: 0, // 从 order 关联获取
        warehouse_entry_id: entry.id,
        work_order_id: entry.work_order_id,
        delivery_date: data.delivery_date || now.slice(0, 10),
        address: data.address || '',
        status: '待发货',
        remark: data.remark || `从进仓单 ${entry.entry_no} 生成`,
        work_order_nos: wo?.prod_no || '',
        created_at: now,
      });
      await manager.save(delivery);

      // 添加送货单明细
      const item = manager.create(DeliveryItem, {
        delivery_id: delivery.id,
        product_id: entry.product_id || 0,
        quantity: remainingQty,
        warehouse_entry_id: entry.id,
      });
      await manager.save(item);

      // 更新进仓单状态
      entry.status = remainingQty >= (entry.quantity || 0) ? '已发货' : '部分发货';
      await manager.save(entry);

      return { success: true, delivery_id: delivery.id, delivery_no: deliveryNo, message: `送货单 ${deliveryNo} 创建成功` };
    });
  }

  /**
   * 批量创建送货单（合并同客户多个进仓单）
   * POST /api/warehouse-entries/batch-delivery
   */
  async batchDelivery(data: { entry_ids: number[]; delivery_date?: string; address?: string; remark?: string }) {
    const { entry_ids, delivery_date, address, remark } = data;
    if (!entry_ids || entry_ids.length === 0) throw new BadRequestException('请选择要发货的进仓单');

    const entries = await this.repo.findByIds(entry_ids);
    if (entries.length === 0) throw new NotFoundException('进仓单不存在');

    return this.dataSource.transaction(async manager => {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const deliveryNo = await this.generateNo('DN');
      const workOrderNos: string[] = [];
      let totalQty = 0;

      // 创建送货单
      const delivery = manager.create(Delivery, {
        delivery_no: deliveryNo,
        order_id: entries[0].order_id,
        customer_id: 0,
        warehouse_entry_id: entries[0].id,
        delivery_date: delivery_date || now.slice(0, 10),
        address: address || '',
        status: '待发货',
        remark: remark || `从 ${entries.length} 张进仓单合并生成`,
        created_at: now,
      });
      await manager.save(delivery);

      for (const entry of entries) {
        // 计算该进仓单已发货数量
        const existingDeliveries = await manager
          .createQueryBuilder(DeliveryItem, 'di')
          .innerJoin(Delivery, 'd', 'd.id = di.delivery_id')
          .select('COALESCE(SUM(di.quantity), 0)', 'total')
          .where('di.warehouse_entry_id = :entryId', { entryId: entry.id })
          .andWhere('d.status != :cancel', { cancel: '已取消' })
          .getRawOne();
        const alreadyDelivered = Number(existingDeliveries?.total) || 0;
        const remaining = (entry.quantity || 0) - alreadyDelivered;

        if (remaining <= 0) continue;

        // 创建明细
        const item = manager.create(DeliveryItem, {
          delivery_id: delivery.id,
          product_id: entry.product_id || 0,
          quantity: remaining,
          warehouse_entry_id: entry.id,
        });
        await manager.save(item);

        // 更新进仓单状态
        entry.status = remaining >= (entry.quantity || 0) ? '已发货' : '部分发货';
        await manager.save(entry);

        totalQty += remaining;

        // 收集工单号
        if (entry.work_order_id) {
          const wo = await manager.findOne(WorkOrder, { where: { id: entry.work_order_id } });
          if (wo?.prod_no) workOrderNos.push(wo.prod_no);
        }
      }

      // 更新送货单的工单号
      delivery.work_order_nos = workOrderNos.join(', ');
      await manager.save(delivery);

      return {
        success: true,
        delivery_id: delivery.id,
        delivery_no: deliveryNo,
        entry_count: entries.length,
        total_qty: totalQty,
        message: `送货单 ${deliveryNo} 创建成功（合并 ${entries.length} 张进仓单，共 ${totalQty} 件）`,
      };
    });
  }

  /**
   * 获取工单的进仓记录及汇总
   * GET /api/warehouse-entries/work-order/:workOrderId
   */
  async getWorkOrderEntries(workOrderId: number) {
    const wo = await this.workOrderRepo.findOne({ where: { id: workOrderId } });
    if (!wo) throw new NotFoundException('工单不存在');

    const entries = await this.repo.find({
      where: { work_order_id: workOrderId },
      order: { id: 'ASC' },
    });

    // 计算每个进仓单的已发货数量 (batch query)
    const entryIds = entries.map(e => e.id);
    const deliveredQtys = entryIds.length > 0
      ? await this.deliveryItemRepo
          .createQueryBuilder('di')
          .innerJoin(Delivery, 'd', 'd.id = di.delivery_id')
          .select('di.warehouse_entry_id', 'entry_id')
          .addSelect('COALESCE(SUM(di.quantity), 0)', 'total')
          .where('di.warehouse_entry_id IN (:...ids)', { ids: entryIds })
          .andWhere('d.status != :cancel', { cancel: '已取消' })
          .groupBy('di.warehouse_entry_id')
          .getRawMany()
      : [];
    const deliveredMap = new Map<number, number>();
    for (const d of deliveredQtys) {
      deliveredMap.set(d.entry_id, Number(d.total) || 0);
    }
    const entriesWithDelivery = entries.map(entry => ({
      ...entry,
      delivered_qty: deliveredMap.get(entry.id) || 0,
    }));

    const product = wo.product_id ? await this.productRepo.findOne({ where: { id: wo.product_id } }) : null;

    const totalEntered = entriesWithDelivery
      .filter(e => e.status !== '已取消')
      .reduce((sum, e) => sum + (e.quantity || 0), 0);
    const totalDelivered = entriesWithDelivery.reduce((sum, e) => sum + e.delivered_qty, 0);

    return {
      work_order: { ...wo, product_name: product?.name },
      entries: entriesWithDelivery,
      summary: {
        total_quantity: wo.quantity || 0,
        completed_quantity: wo.completed_qty || 0,
        entered_quantity: totalEntered,
        remaining_enterable: (wo.completed_qty || 0) - totalEntered,
        delivered_quantity: totalDelivered,
        remaining_deliverable: totalEntered - totalDelivered,
      },
    };
  }

  // ========== 工具方法 ==========

  /**
   * 生成业务单号（简单实现：前缀 + 时间戳 + 随机数）
   * 旧系统用 sequence 表，新系统暂用时间戳方案
   */
  private async generateNo(prefix: string): Promise<string> {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}${ts}${rand}`;
  }
}
