import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Table, Tag, Statistic, Input, Button, Space, message, Modal, Descriptions } from 'antd';
import { SearchOutlined, ReloadOutlined, DollarOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../utils/axios';

interface ArSummary {
  key: string;
  party_name: string;
  totalAR: number;
  totalPaid: number;
  discount: number;
  remaining: number;
  records: any[];
}

export default function AccountsReceivable() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ArSummary[]>([]);
  const [search, setSearch] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ArSummary | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recordsRes, customersRes] = await Promise.all([
        api.get('/finance_records'),
        api.get('/customers'),
      ]);
      const records = recordsRes.data || [];
      const customers = customersRes.data || [];
      const customerMap: Record<string, string> = {};
      customers.forEach((c: any) => { customerMap[c.name] = c.name; });

      // Group by party_name
      const groups: Record<string, { totalAR: number; totalPaid: number; records: any[] }> = {};
      records.forEach((r: any) => {
        const name = r.party_name || '未知';
        if (!groups[name]) groups[name] = { totalAR: 0, totalPaid: 0, records: [] };
        if (r.type === '应收' || r.type === 'income') {
          groups[name].totalAR += r.amount || 0;
        } else if (r.type === '收款' || r.type === 'expense') {
          groups[name].totalPaid += r.amount || 0;
        }
        groups[name].records.push(r);
      });

      const list: ArSummary[] = Object.entries(groups)
        .map(([name, g]) => ({
          key: name,
          party_name: name,
          totalAR: g.totalAR,
          totalPaid: g.totalPaid,
          discount: 0,
          remaining: g.totalAR - g.totalPaid,
          records: g.records,
        }))
        .sort((a, b) => b.remaining - a.remaining);

      setData(list);
    } catch (e) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    if (!search) return data;
    return data.filter(d => d.party_name.includes(search));
  }, [data, search]);

  const totalAR = data.reduce((s, d) => s + d.totalAR, 0);
  const totalPaid = data.reduce((s, d) => s + d.totalPaid, 0);
  const totalRemaining = data.reduce((s, d) => s + d.remaining, 0);

  const columns = [
    {
      title: '操作', key: 'action', width: 160, fixed: 'left' as const,
      render: (_: any, r: ArSummary) => (
        <Space size="small">
          <a onClick={() => { setSelectedCustomer(r); setDetailVisible(true); }}>
            <EyeOutlined /> 查看
          </a>
        </Space>
      ),
    },
    { title: '客户名称', dataIndex: 'party_name', key: 'party_name', sorter: (a: ArSummary, b: ArSummary) => a.party_name.localeCompare(b.party_name) },
    {
      title: '合计应收', dataIndex: 'totalAR', key: 'totalAR', sorter: (a: ArSummary, b: ArSummary) => a.totalAR - b.totalAR,
      render: (v: number) => <span style={{ color: '#cf1322', fontWeight: 500 }}>¥{v.toLocaleString()}</span>,
    },
    {
      title: '合计已收', dataIndex: 'totalPaid', key: 'totalPaid', sorter: (a: ArSummary, b: ArSummary) => a.totalPaid - b.totalPaid,
      render: (v: number) => <span style={{ color: '#389e0d' }}>¥{v.toLocaleString()}</span>,
    },
    { title: '优惠', dataIndex: 'discount', key: 'discount', render: (v: number) => `¥${v.toLocaleString()}` },
    {
      title: '剩余应收', dataIndex: 'remaining', key: 'remaining', sorter: (a: ArSummary, b: ArSummary) => a.remaining - b.remaining,
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#cf1322' : '#389e0d', fontWeight: 600 }}>
          ¥{v.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>应收账款</h2>

      {/* Summary Bar */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small"><Statistic title="应收总额" value={totalAR} precision={2} prefix="¥" valueStyle={{ color: '#cf1322' }} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="已收总额" value={totalPaid} precision={2} prefix="¥" valueStyle={{ color: '#389e0d' }} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="优惠合计" value={0} precision={2} prefix="¥" /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="剩余应收" value={totalRemaining} precision={2} prefix="¥" valueStyle={{ color: totalRemaining > 0 ? '#cf1322' : '#389e0d' }} /></Card>
        </Col>
      </Row>

      {/* Search + Table */}
      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <Input
          placeholder="搜索客户名称"
          prefix={<SearchOutlined />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 240 }}
          allowClear
        />
        <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
      </div>

      <Table
        rowKey="key"
        loading={loading}
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 20, showTotal: (t: number) => `共 ${t} 条` }}
        size="small"
      />

      {/* Detail Modal */}
      <Modal
        title={`${selectedCustomer?.party_name || ''} - 应收明细`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedCustomer && (
          <>
            <Descriptions column={4} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="合计应收">¥{selectedCustomer.totalAR.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="合计已收">¥{selectedCustomer.totalPaid.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="优惠">¥{selectedCustomer.discount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="剩余应收">
                <span style={{ color: selectedCustomer.remaining > 0 ? '#cf1322' : '#389e0d', fontWeight: 600 }}>
                  ¥{selectedCustomer.remaining.toLocaleString()}
                </span>
              </Descriptions.Item>
            </Descriptions>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={selectedCustomer.records}
              columns={[
                { title: '单号', dataIndex: 'ref_no', key: 'ref_no' },
                { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color={v === '收款' ? 'green' : 'blue'}>{v}</Tag> },
                { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => `¥${(v || 0).toLocaleString()}` },
                { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag>{v}</Tag> },
                { title: '到期日', dataIndex: 'due_date', key: 'due_date' },
                { title: '说明', dataIndex: 'description', key: 'description' },
              ]}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
