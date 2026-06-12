import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Purchase } from '../entities/purchases';
import { PurchaseItem } from '../entities/purchase_items';
import { WorkshopInventory } from '../entities/workshop_inventory';
import { WorkshopInventoryLog } from '../entities/workshop_inventory_logs';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private readonly repo: Repository<Purchase>,
    @InjectRepository(PurchaseItem)
    private readonly itemRepo: Repository<PurchaseItem>,
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
   * 业务方法：创建采购单（含明细）
   * POST /api/purchases
   * body: { purchase_no?, supplier_id, total_amount?, delivery_date?, remark?, items: [...] }
   *
   * 支持 items 字段，自动写 purchase_items
   */
  async createWithItems(data: any) {
    const { items, ...purchaseData } = data;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const purchaseNo = purchaseData.purchase_no || `PO${now.replace(/[^0-9]/g, '')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    return this.dataSource.transaction(async manager => {
      const total = items && items.length > 0
        ? items.reduce((s: number, it: any) => s + (Number(it.amount) || Number(it.quantity || 0) * Number(it.unit_price || 0)), 0)
        : (purchaseData.total_amount || 0);

      const purchase = manager.create(Purchase, {
        purchase_no: purchaseNo,
        supplier_id: purchaseData.supplier_id || 0,
        status: purchaseData.status || '待审批',
        total_amount: total,
        delivery_date: purchaseData.delivery_date || '',
        remark: purchaseData.remark || '',
        created_at: now,
        ref_type: purchaseData.ref_type || '',
        ref_id: purchaseData.ref_id || 0,
        work_order_id: purchaseData.work_order_id || 0,
        delivery_address: purchaseData.delivery_address || '',
      });
      const saved = await manager.save(purchase);

      const savedItems: PurchaseItem[] = [];
      if (items && Array.isArray(items)) {
        for (const it of items) {
          const pi = manager.create(PurchaseItem, {
            purchase_id: saved.id,
            material_name: it.material_name || '',
            spec: it.spec || '',
            quantity: Number(it.quantity || 0),
            unit_price: Number(it.unit_price || 0),
            amount: Number(it.amount || it.quantity * it.unit_price || 0),
            ref_info: it.ref_info || '',
            paper_type: it.paper_type || '',
            unit: it.unit || '',
            delivery_address: it.delivery_address || '',
          });
          const savedItem = await manager.save(pi);
          savedItems.push(savedItem);
        }
      }
      return { ...saved, items: savedItems };
    });
  }

  /**
   * 业务方法：采购单审批
   * POST /api/purchases/:id/approve
   * body: { approved: boolean, reason?: string }
   */
  async approve(id: number, data: { approved: boolean; reason?: string }) {
    const purchase = await this.repo.findOne({ where: { id } });
    if (!purchase) throw new NotFoundException(`采购单 ${id} 不存在`);
    if (purchase.status !== '待审批') {
      throw new BadRequestException(`采购单状态 ${purchase.status} 不能审批`);
    }
    purchase.status = data.approved ? '已审批' : '已驳回';
    if (data.reason) purchase.remark = (purchase.remark || '') + ` [审批: ${data.reason}]`;
    return this.repo.save(purchase);
  }

  /**
   * 业务方法：采购单入库（材料 → 车间库存）
   * POST /api/purchases/:id/receive
   * body: { items?: [{ id, received_qty }] }  // 不传则全部按采购数量入库
   *
   * 流程：已审批 → 写入 workshop_inventory + workshop_inventory_logs
   *      → 采购单状态变为 已入库
   */
  async receive(id: number, data: { items?: Array<{ id: number; received_qty: number }> } = { items: [] }) {
    const purchase = await this.repo.findOne({ where: { id } });
    if (!purchase) throw new NotFoundException(`采购单 ${id} 不存在`);
    if (purchase.status !== '已审批' && purchase.status !== '待审批') {
      throw new BadRequestException(`采购单状态 ${purchase.status} 不能入库`);
    }

    return this.dataSource.transaction(async manager => {
      const items = await manager.find(PurchaseItem, { where: { purchase_id: id } });
      if (items.length === 0) throw new BadRequestException('采购单无明细');

      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const receiveMap = new Map<number, number>();
      if (data.items && data.items.length > 0) {
        for (const it of data.items) {
          receiveMap.set(it.id, it.received_qty);
        }
      }

      const invList: WorkshopInventory[] = [];
      for (const item of items) {
        const recvQty = receiveMap.has(item.id) ? Number(receiveMap.get(item.id)!) : Number(item.quantity || 0);
        if (recvQty <= 0) continue;

        // 写入车间库存
        const inv = manager.create(WorkshopInventory, {
          material_name: item.material_name,
          material_spec: item.spec,
          material_type: item.paper_type || '原材料',
          quantity: recvQty,
          unit: item.unit,
          source_type: 'purchase',
          source_id: purchase.id,
          work_order_id: 0,
          status: '可用',
          created_at: now,
          updated_at: now,
        });
        const savedInv = await manager.save(inv);
        invList.push(savedInv);

        // 写库存日志
        const log = manager.create(WorkshopInventoryLog, {
          material_name: item.material_name,
          material_spec: item.spec,
          type: '入库',
          quantity: recvQty,
          ref_type: 'purchase',
          ref_id: purchase.id,
          work_order_id: 0,
          remark: `采购单 ${purchase.purchase_no} 入库`,
          created_at: now,
        });
        await manager.save(log);
      }

      // 更新采购单状态
      purchase.status = '已入库';
      return { purchase, inventories: invList };
    });
  }

  /**
   * 业务方法：取消采购单
   * POST /api/purchases/:id/cancel
   */
  async cancel(id: number, data: { reason: string }) {
    const purchase = await this.repo.findOne({ where: { id } });
    if (!purchase) throw new NotFoundException(`采购单 ${id} 不存在`);
    if (purchase.status === '已入库' || purchase.status === '已取消') {
      throw new BadRequestException(`采购单状态 ${purchase.status} 不能取消`);
    }
    purchase.status = '已取消';
    purchase.remark = (purchase.remark || '') + ` [取消: ${data.reason || ''}]`;
    return this.repo.save(purchase);
  }

  /**
   * 业务方法：按采购单号查询
   */
  async findByNo(purchaseNo: string) {
    const p = await this.repo.findOne({ where: { purchase_no: purchaseNo } });
    if (!p) throw new NotFoundException(`采购单 ${purchaseNo} 不存在`);
    const items = await this.itemRepo.find({ where: { purchase_id: p.id } });
    return { ...p, items };
  }

  create(data: Partial<Purchase>) {
    return this.createWithItems(data);
  }

  async update(id: number, data: Partial<Purchase>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`purchases ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`purchases ${id} not found`);
    await this.itemRepo.delete({ purchase_id: id });
    return this.repo.remove(item);
  }

  // ========== 补充业务方法（旧系统已有） ==========

  /**
   * 打印时生成正式采购单号（替换临时号）
   * POST /api/purchases/:id/generate-no
   */
  async generateNo(id: number) {
    const purchase = await this.repo.findOne({ where: { id } });
    if (!purchase) throw new NotFoundException(`采购单 ${id} 不存在`);
    if (purchase.purchase_no && !purchase.purchase_no.startsWith('TMP')) {
      return { purchase_no: purchase.purchase_no };
    }
    const now = Date.now();
    const no = `PO${now}`;
    purchase.purchase_no = no;
    purchase.status = '已出单';
    await this.repo.save(purchase);
    return { purchase_no: no };
  }

  /**
   * 更新采购单号（合并打印时使用）
   * POST /api/purchases/:id/update-no
   */
  async updateNo(id: number, data: { purchase_no: string }) {
    const purchase = await this.repo.findOne({ where: { id } });
    if (!purchase) throw new NotFoundException(`采购单 ${id} 不存在`);
    purchase.purchase_no = data.purchase_no;
    purchase.status = '已出单';
    await this.repo.save(purchase);
    return { success: true };
  }

  /**
   * 获取采购单明细
   * GET /api/purchases/:id/items
   */
  async getItems(id: number) {
    const purchase = await this.repo.findOne({ where: { id } });
    if (!purchase) throw new NotFoundException(`采购单 ${id} 不存在`);
    return this.itemRepo.find({ where: { purchase_id: id } });
  }
}