import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Tabs, Progress, Input, Space, Empty } from 'antd';
import { UnorderedListOutlined, PlayCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../utils/axios';

interface WorkOrder {
  id: number; prod_no: string; order_id: number; product_id: number;
  quantity: number; completed_qty: number; material_type: string; box_type: string;
  status: string; priority: string; worker: string;
  start_time: string; end_time: string; processes: string; created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
  '待排产': 'default', '生产中': 'orange', '待完工': 'purple',
  '已完成': 'green', '已取消': 'red', '暂停': 'orange',
};

export default function ProductionDashboard() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/work_orders');
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return orders;
    return orders.filter(o => o.status === activeTab);
  }, [orders, activeTab]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === '待排产').length,
    inProgress: orders.filter(o => o.status === '生产中').length,
    completed: orders.filter(o => o.status === '已完成').length,
  }), [orders]);

  const columns = [
    { title: '工单号', dataIndex: 'prod_no', key: 'prod_no', render: (v: string) => v || '-' },
    { title: '订单ID', dataIndex: 'order_id', key: 'order_id', width: 80 },
    { title: '产品ID', dataIndex: 'product_id', key: 'product_id', width: 80 },
    { title: '材料', dataIndex: 'material_type', key: 'material_type' },
    { title: '箱型', dataIndex: 'box_type', key: 'box_type' },
    {
      title: '进度', key: 'progress', width: 140,
      render: (_: unknown, r: WorkOrder) => {
        const pct = r.quantity > 0 ? Math.round((r.completed_qty / r.quantity) * 100) : 0;
        return <Progress percent={pct} size="small" status={pct >= 100 ? 'success' : 'active'} />;
      },
    },
    { title: '数量', key: 'qty', width: 90, render: (_: unknown, r: WorkOrder) => `${r.completed_qty || 0}/${r.quantity || 0}` },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s: string) => <Tag color={STATUS_COLOR[s] || 'default'}>{s}</Tag>,
    },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 70 },
    { title: '工人', dataIndex: 'worker', key: 'worker', width: 80 },
    { title: '工序', dataIndex: 'processes', key: 'processes', ellipsis: true },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 140, render: (v: string) => v?.split(' ')[0] },
  ];

  const tabItems = [
    { key: 'all', label: `全部 (${stats.total})` },
    { key: '待排产', label: `待排产 (${stats.pending})` },
    { key: '生产中', label: `生产中 (${stats.inProgress})` },
    { key: '已完成', label: `已完成 (${stats.completed})` },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>生产看板</h2>
        <Space>
          <ReloadOutlined onClick={fetchData} style={{ cursor: 'pointer' }} />
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="总工单" value={stats.total} prefix={<UnorderedListOutlined />} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="待排产" value={stats.pending} valueStyle={{ color: '#8c8c8c' }} prefix={<ClockCircleOutlined />} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="生产中" value={stats.inProgress} valueStyle={{ color: '#d97706' }} prefix={<PlayCircleOutlined />} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="已完成" value={stats.completed} valueStyle={{ color: '#389e0d' }} prefix={<CheckCircleOutlined />} /></Card></Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {filtered.length > 0 ? (
        <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered}
          pagination={{ pageSize: 20, showTotal: (t: number) => `共 ${t} 条` }}
          scroll={{ x: 1000 }}
        />
      ) : (
        <Empty description="暂无工单" />
      )}
    </div>
  );
}
