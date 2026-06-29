import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceRecord } from '../entities/finance_records';

@Injectable()
export class FinanceRecordService {
  constructor(
    @InjectRepository(FinanceRecord)
    private readonly repo: Repository<FinanceRecord>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<FinanceRecord>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<FinanceRecord>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`finance_records ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`finance_records ${id} not found`);
    return this.repo.remove(item);
  }

  // ========== 补充业务方法（旧系统 misc.js 财务端点） ==========

  /**
   * 结算（标记已结清）
   * PUT /api/finance-records/:id/settle
   */
  async settle(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`财务记录 ${id} 不存在`);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    item.status = '已结清';
    item.paid_at = now;
    return this.repo.save(item);
  }

  /**
   * 冲正（标记已冲正 + 写反向记录）
   * POST /api/finance-records/:id/cancel
   * body: { reason, username? }
   */
  async cancel(id: number, data: { reason: string; username?: string }) {
    const record = await this.findOne(id);
    if (!record) throw new NotFoundException(`财务记录 ${id} 不存在`);
    if (record.status === '已冲正') {
      throw new BadRequestException('该记录已冲正，不能重复冲正');
    }
    if (!data.reason || !data.reason.trim()) {
      throw new BadRequestException('冲正必须填写原因');
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    // 1) 标记原记录作废
    record.status = '已冲正';
    record.canceled_at = now;
    record.canceled_reason = data.reason;
    record.canceled_by = data.username || '未知';
    await this.repo.save(record);

    // 2) 写反向冲正记录
    const reverseType = record.type === '收入' ? '支出' : (record.type === '支出' ? '收入' : null);
    if (reverseType) {
      const reverse = this.repo.create({
        type: reverseType,
        ref_no: `REV-${record.ref_no || record.id}`,
        ref_type: `冲正:${record.ref_type || ''}`,
        party_name: record.party_name,
        amount: record.amount,
        status: '已结清',
        due_date: record.due_date,
        period_type: record.period_type,
        category: record.category,
        description: `[冲正] ${data.reason} | 原单 ${record.ref_no || record.id}`,
        created_at: now,
        paid_at: now,
        canceled_at: '',
        canceled_reason: '',
        canceled_by: '',
      });
      await this.repo.save(reverse);
    }

    return { ok: true, message: '已冲正' };
  }

  /**
   * 财务汇总（应收/应付/收入/支出/利润）
   * GET /api/finance-records/summary
   */
  async summary() {
    // WARNING: Production risk — loading all records without limit. Consider date-range filtering.
    const records = await this.repo.find({ order: { id: 'DESC' }, take: 5000 });
    const totalReceivable = records.filter(r => r.type === '应收').reduce((s, r) => s + (r.amount || 0), 0);
    const totalPayable = records.filter(r => r.type === '应付').reduce((s, r) => s + (r.amount || 0), 0);
    const totalIncome = records.filter(r => r.type === '收入').reduce((s, r) => s + (r.amount || 0), 0);
    const totalExpense = records.filter(r => r.type === '支出').reduce((s, r) => s + (r.amount || 0), 0);
    return {
      records,
      summary: {
        totalReceivable,
        totalPayable,
        totalIncome,
        totalExpense,
        profit: totalIncome - totalExpense,
      },
    };
  }
}
