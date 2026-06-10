import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, message, Row, Space, Statistic, Table, Tag } from 'antd';
import { BankOutlined, ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
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
