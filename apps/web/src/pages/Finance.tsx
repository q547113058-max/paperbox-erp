import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, message, Row, Space, Statistic, Table, Tag } from 'antd';
import { BankOutlined, ArrowRightOutlined, ReloadOutlined, CalendarOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../utils/axios';
import { FinanceRecord } from '../types/api';
import { getStatusColor } from '../utils/statusColor';

async function loadFinanceRecords() {
  try { return await api.get('/finance_records'); }
  catch { return api.get('/finance-records'); }
}

function money(v: number) {
  return `¥${Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  '销售货款': 'blue',
  '加工费': 'cyan',
  '运费': 'gold',
  '其他应收': 'default',
  '采购货款': 'purple',
  '委外加工费': 'magenta',
  '工资': 'volcano',
  '其他应付': 'default',
  '默认': 'default',
};

function categoryColor(c: string) {
  return CATEGORY_COLORS[c] || 'default';
}

interface MonthBucket {
  month: string;        // YYYY-MM
  monthLabel: string;   // YYYY/MM
  income: number;
  expense: number;
  net: number;
  receivableNew: number;
  payableNew: number;
  count: number;
}

interface CategoryBucket {
  category: string;
  type: string;         // 应收/应付/收入/支出
  amount: number;
  count: number;
}

function monthKey(date: string) {
  if (!date) return '';
  // 接受 YYYY-MM-DD、YYYY-MM、YYYY/MM/DD、ISO 等
  const d = dayjs(date);
  return d.isValid() ? d.format('YYYY-MM') : '';
}

export default function Finance() {
  const navigate = useNavigate();
  const [data, setData] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    loadFinanceRecords()
      .then((r) => setData(r.data || []))
      .catch(() => message.error('加载财务汇总失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const summary = useMemo(() => {
    const valid = data.filter((r) => r.status !== '已冲正');
    const receivables = valid.filter((r) => r.type === '应收');
    const payables = valid.filter((r) => r.type === '应付');
    const income = valid.filter((r) => r.type === '收入');
    const expense = valid.filter((r) => r.type === '支出');
    return {
      receivableAmount: receivables.reduce((s, r) => s + Number(r.amount || 0), 0),
      payableAmount: payables.reduce((s, r) => s + Number(r.amount || 0), 0),
      incomeAmount: income.reduce((s, r) => s + Number(r.amount || 0), 0),
      expenseAmount: expense.reduce((s, r) => s + Number(r.amount || 0), 0),
      receivableOpen: receivables.filter((r) => r.status !== '已结清').length,
      payableOpen: payables.filter((r) => r.status !== '已结清').length,
    };
  }, [data]);

  // 月度汇总：最近 12 个月（包含当前月）
  const monthlySummary = useMemo<MonthBucket[]>(() => {
    const months: MonthBucket[] = [];
    const now = dayjs();
    for (let i = 11; i >= 0; i--) {
      const m = now.subtract(i, 'month');
      months.push({
        month: m.format('YYYY-MM'),
        monthLabel: m.format('YYYY/MM'),
        income: 0,
        expense: 0,
        net: 0,
        receivableNew: 0,
        payableNew: 0,
        count: 0,
      });
    }
    const monthIndex: Record<string, number> = {};
    months.forEach((mb, idx) => { monthIndex[mb.month] = idx; });

    data.forEach((r) => {
      if (r.status === '已冲正') return;
      const k = monthKey(r.created_at) || monthKey(r.paid_at) || monthKey(r.due_date);
      if (!k) return;
      const idx = monthIndex[k];
      if (idx === undefined) return;
      const bucket = months[idx];
      const amt = Number(r.amount || 0);
      if (r.type === '收入') bucket.income += amt;
      else if (r.type === '支出') bucket.expense += amt;
      else if (r.type === '应收') bucket.receivableNew += amt;
      else if (r.type === '应付') bucket.payableNew += amt;
      bucket.count += 1;
    });
    months.forEach((mb) => { mb.net = mb.income - mb.expense; });
    return months;
  }, [data]);

  // 类别分布：按 category 聚合
  const categorySummary = useMemo<CategoryBucket[]>(() => {
    const map: Record<string, CategoryBucket> = {};
    data.forEach((r) => {
      if (r.status === '已冲正') return;
      const cat = r.category || '未分类';
      const t = r.type || '其他';
      const key = `${t}::${cat}`;
      if (!map[key]) {
        map[key] = { category: cat, type: t, amount: 0, count: 0 };
      }
      map[key].amount += Number(r.amount || 0);
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [data]);

  const recent = data.slice(0, 8);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>财务管理</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchAll}>刷新</Button>
          <Button type="primary" onClick={() => navigate('/receivables')}>应收管理 <ArrowRightOutlined /></Button>
          <Button danger onClick={() => navigate('/payables')}>应付管理 <ArrowRightOutlined /></Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small" style={{ borderTop: '3px solid #1677ff' }}>
          <Statistic title="应收总额" prefix="¥" value={summary.receivableAmount} precision={2} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col span={6}><Card size="small" style={{ borderTop: '3px solid #cf1322' }}>
          <Statistic title="应付总额" prefix="¥" value={summary.payableAmount} precision={2} valueStyle={{ color: '#cf1322' }} /></Card></Col>
        <Col span={6}><Card size="small" style={{ borderTop: '3px solid #52c41a' }}>
          <Statistic title="收入" prefix="¥" value={summary.incomeAmount} precision={2} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card size="small" style={{ borderTop: '3px solid #fa8c16' }}>
          <Statistic title="支出" prefix="¥" value={summary.expenseAmount} precision={2} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card
            hoverable
            title={<Space><BankOutlined /> 应收管理</Space>}
            extra={<Button type="link" onClick={() => navigate('/receivables')}>进入</Button>}
            style={{ borderTop: '3px solid #1677ff' }}
          >
            <Statistic title="未结清笔数" value={summary.receivableOpen} valueStyle={{ color: '#1677ff' }} />
            <div style={{ marginTop: 8, color: '#64748b' }}>客户货款、销售对账、加工费等应收款跟踪。</div>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            hoverable
            title={<Space><BankOutlined /> 应付管理</Space>}
            extra={<Button type="link" danger onClick={() => navigate('/payables')}>进入</Button>}
            style={{ borderTop: '3px solid #cf1322' }}
          >
            <Statistic title="未结清笔数" value={summary.payableOpen} valueStyle={{ color: '#cf1322' }} />
            <div style={{ marginTop: 8, color: '#64748b' }}>采购货款、委外加工费、运费等应付款跟踪。</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={14}>
          <Card
            size="small"
            title={<Space><CalendarOutlined style={{ color: '#2c5282' }} />月度汇总（最近 12 个月）</Space>}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              size="small"
              rowKey="month"
              dataSource={monthlySummary}
              pagination={false}
              scroll={{ y: 360 }}
              columns={[
                { title: '月份', dataIndex: 'monthLabel', width: 80, fixed: 'left' as const,
                  render: (v: string, r: MonthBucket) => (
                    <span style={{ fontWeight: r.month === dayjs().format('YYYY-MM') ? 600 : 400, color: r.month === dayjs().format('YYYY-MM') ? '#2c5282' : undefined }}>{v}</span>
                  ) },
                { title: '收入', dataIndex: 'income', width: 110, align: 'right' as const,
                  render: (v: number) => <span style={{ color: '#52c41a', whiteSpace: 'nowrap' }}>{money(v)}</span> },
                { title: '支出', dataIndex: 'expense', width: 110, align: 'right' as const,
                  render: (v: number) => <span style={{ color: '#fa8c16', whiteSpace: 'nowrap' }}>{money(v)}</span> },
                { title: '净收入', dataIndex: 'net', width: 120, align: 'right' as const,
                  render: (v: number) => <span style={{ fontWeight: 600, color: v >= 0 ? '#1677ff' : '#cf1322', whiteSpace: 'nowrap' }}>{money(v)}</span> },
                { title: '应收新增', dataIndex: 'receivableNew', width: 120, align: 'right' as const,
                  render: (v: number) => <span style={{ color: '#1677ff', whiteSpace: 'nowrap' }}>{v > 0 ? money(v) : '-'}</span> },
                { title: '应付新增', dataIndex: 'payableNew', width: 120, align: 'right' as const,
                  render: (v: number) => <span style={{ color: '#cf1322', whiteSpace: 'nowrap' }}>{v > 0 ? money(v) : '-'}</span> },
                { title: '笔数', dataIndex: 'count', width: 70, align: 'right' as const,
                  render: (v: number) => v > 0 ? <Tag color={v > 0 ? 'blue' : 'default'}>{v}</Tag> : '-' },
              ]}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card
            size="small"
            title={<Space><AppstoreOutlined style={{ color: '#2c5282' }} />类别分布</Space>}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              size="small"
              rowKey={(r: CategoryBucket) => `${r.type}::${r.category}`}
              dataSource={categorySummary}
              pagination={false}
              scroll={{ y: 360 }}
              locale={{ emptyText: '暂无数据' }}
              columns={[
                { title: '类别', dataIndex: 'category', width: 130,
                  render: (v: string) => <Tag color={categoryColor(v)}>{v || '未分类'}</Tag> },
                { title: '类型', dataIndex: 'type', width: 80,
                  render: (v: string) => {
                    const c = v === '应收' ? 'blue' : v === '应付' ? 'red' : v === '收入' ? 'green' : v === '支出' ? 'orange' : 'default';
                    return <Tag color={c}>{v}</Tag>;
                  } },
                { title: '金额', dataIndex: 'amount', align: 'right' as const,
                  render: (v: number) => <b style={{ whiteSpace: 'nowrap' }}>{money(v)}</b> },
                { title: '笔数', dataIndex: 'count', width: 70, align: 'right' as const,
                  render: (v: number) => <Tag>{v}</Tag> },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title="最近财务记录" size="small">
        <Table
          rowKey="id"
          size="small"
          loading={loading}
          dataSource={recent}
          pagination={false}
          columns={[
            { title: '类型', dataIndex: 'type', width: 80, render: (v: string) => <Tag color={v === '应收' ? 'blue' : v === '应付' ? 'red' : 'default'}>{v}</Tag> },
            { title: '单号', dataIndex: 'ref_no', width: 140, render: (v: string) => v || '-' },
            { title: '往来单位', dataIndex: 'party_name', width: 160, render: (v: string) => v || '-' },
            { title: '金额', dataIndex: 'amount', width: 120, align: 'right' as const, render: (v: number) => <b>{money(v)}</b> },
            { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => <Tag color={getStatusColor(v)}>{v || '-'}</Tag> },
            { title: '到期日', dataIndex: 'due_date', width: 110, render: (v: string) => v || '-' },
            { title: '说明', dataIndex: 'description', ellipsis: true, render: (v: string) => v || '-' },
          ]}
        />
      </Card>
    </div>
  );
}
