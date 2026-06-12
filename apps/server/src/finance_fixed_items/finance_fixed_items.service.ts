import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { FinanceFixedItem } from '../entities/finance_fixed_items';
import { FinanceRecord } from '../entities/finance_records';

@Injectable()
export class FinanceFixedItemService {
  constructor(
    @InjectRepository(FinanceFixedItem)
    private readonly repo: Repository<FinanceFixedItem>,
    @InjectRepository(FinanceRecord)
    private readonly financeRepo: Repository<FinanceRecord>,
    private readonly dataSource: DataSource,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<FinanceFixedItem>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<FinanceFixedItem>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`finance_fixed_items ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`finance_fixed_items ${id} not found`);
    return this.repo.remove(item);
  }

  /**
   * 应用固定项目到指定月份（生成财务记录）
   * POST /api/finance-fixed-items/apply
   * body: { month: '2026-06', items: [{ id: number }] }
   */
  async apply(data: { month: string; items: Array<{ id: number }> }) {
    const { month, items } = data;
    if (!month || !items || items.length === 0) {
      throw new Error('月份和项目列表不能为空');
    }

    const applied: string[] = [];

    for (const { id } of items) {
      const item = await this.findOne(id);
      if (!item) continue;

      // 检查是否已应用过该月
      const existing = await this.financeRepo
        .createQueryBuilder('fr')
        .where("fr.ref_type = '固定项目'")
        .andWhere('fr.ref_no = :name', { name: item.name })
        .andWhere("strftime('%Y-%m', fr.created_at) = :month", { month })
        .getOne();

      if (!existing) {
        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
        const record = this.financeRepo.create({
          type: item.type,
          ref_no: item.name,
          ref_type: '固定项目',
          party_name: item.party_name || '',
          amount: item.amount || 0,
          status: '未结清',
          due_date: '',
          period_type: item.period_type || '月',
          category: item.category || '',
          description: `${month} ${item.name}`,
          created_at: now,
          paid_at: '',
          canceled_at: '',
          canceled_reason: '',
          canceled_by: '',
        });
        await this.financeRepo.save(record);
        applied.push(item.name);
      }
    }

    return { success: true, applied, count: applied.length };
  }
}
