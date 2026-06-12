import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkshopInventory } from '../entities/workshop_inventory';

@Injectable()
export class WorkshopInventoryService {
  constructor(
    @InjectRepository(WorkshopInventory)
    private readonly repo: Repository<WorkshopInventory>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<WorkshopInventory>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<WorkshopInventory>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`workshop_inventory ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`workshop_inventory ${id} not found`);
    return this.repo.remove(item);
  }

  // ========== 补充业务方法 ==========

  /**
   * 库存汇总（按物料名+规格分组统计）
   * GET /api/workshop-inventory/summary
   */
  async summary() {
    return this.repo
      .createQueryBuilder('wi')
      .select([
        'wi.material_name as material_name',
        'wi.material_spec as material_spec',
        'wi.material_type as material_type',
        'wi.unit as unit',
        'SUM(wi.quantity) as total_quantity',
        'COUNT(*) as entry_count',
      ])
      .where('wi.status = :status', { status: '可用' })
      .groupBy('wi.material_name')
      .addGroupBy('wi.material_spec')
      .addGroupBy('wi.material_type')
      .addGroupBy('wi.unit')
      .orderBy('wi.material_name', 'ASC')
      .getRawMany();
  }

  /**
   * 发料（从车间库存扣减）
   * POST /api/workshop-inventory/issue
   * body: { material_name, material_spec?, quantity, work_order_id?, remark? }
   */
  async issue(data: { material_name: string; material_spec?: string; quantity: number; work_order_id?: number; remark?: string }) {
    const { material_name, material_spec, quantity, work_order_id, remark } = data;
    if (!material_name || !quantity || quantity <= 0) {
      throw new Error('物料名和数量（>0）不能为空');
    }

    // 查找可用库存
    const items = await this.repo.find({
      where: { material_name, material_spec: material_spec || '', status: '可用' },
      order: { id: 'ASC' },
    });

    const totalAvailable = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    if (totalAvailable < quantity) {
      throw new Error(`库存不足：需要 ${quantity}，可用 ${totalAvailable}`);
    }

    // 先进先出扣减
    let remaining = quantity;
    for (const item of items) {
      if (remaining <= 0) break;
      const deduct = Math.min(remaining, item.quantity || 0);
      item.quantity = (item.quantity || 0) - deduct;
      if (item.quantity <= 0) {
        item.status = '已用完';
      }
      await this.repo.save(item);
      remaining -= deduct;
    }

    // 写发料日志
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const logRepo = this.repo.manager.getRepository('workshop_inventory_logs');
    await logRepo.save(logRepo.create({
      material_name,
      material_spec: material_spec || '',
      type: '出库',
      quantity,
      ref_type: work_order_id ? 'work_order' : 'manual',
      ref_id: work_order_id || 0,
      work_order_id: work_order_id || 0,
      remark: remark || '手动发料',
      created_at: now,
    }));

    return { success: true, issued: quantity, remaining: totalAvailable - quantity };
  }
}
