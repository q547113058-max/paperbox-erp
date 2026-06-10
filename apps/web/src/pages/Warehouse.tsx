import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Tag, message, Modal, Descriptions, Card, Col, Row, Statistic } from 'antd';
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { WarehouseEntry, Order, WorkOrder } from '../types/api';
import api from '../utils/axios';

const STATUS_COLOR: Record<string, string> = {
  '待发货': 'orange', '已发货': 'blue', '已收货': 'green', '已取消': 'red',
};

export default function Warehouse() {
  const [data, setData] = useState<WarehouseEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<WarehouseEntry | null>(null);

  const fetchData = () => {
    setLoading(true);
    api.get('/warehouse-entries').then((r) => setData(r.data)).catch(() => message.error('加载失败')).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    api.get('/orders').then((r) => setOrders(r.data)).catch(() => {});
    api.get('/work-orders').then((r) => setWorkOrders(r.data)).catch(() => {});
  }, []);

  const orderMap = new Map(orders.map((o) => [o.id, o.order_no || `#${o.id}`]));
  const workOrderMap = new Map(workOrders.map((w) => [w.id, w.work_order_no || `#${w.id}`]));

  const countByStatus = (status: string) => data.filter((d) => d.status === status).length;

  const filtered = data.filter((w) =>
    !keyword || w.entry_no?.includes(keyword) || w.product_name?.includes(keyword) || String(w.order_id).includes(keyword)
  );

  const openDetail = (r: WarehouseEntry) => { setDetail(r); setDetailOpen(true); };

  const columns = [
    { title: '入库单号', dataIndex: 'entry_no', key: 'entry_no', width: 130, render: (v: string) => v || '-' },
    { title: '产品名称', dataIndex: 'product_name', key: 'product_name', width: 150 },
    { title: '订单号', dataIndex: 'order_id', key: 'order_id', width: 120, render: (v: number) => orderMap.get(v) || `#${v}` },
    { title: '工单号', dataIndex: 'work_order_id', key: 'work_order_id', width: 120, render: (v: number | null) => v ? (workOrderMap.get(v) || `#${v}`) : '-' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 90, align: 'right' as const },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (s: string) => <Tag color={STATUS_COLOR[s] || 'default'}>{s}</Tag> },
    { title: '创建日期', dataIndex: 'created_at', key: 'created_at', width: 110, render: (v: string) => v?.split('T')[0] || v },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    {
      title: '操作', key: 'action', width: 80, fixed: 'right' as const,
      render: (_: any, r: WarehouseEntry) => (
        <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>仓库入库</h2>
        <Space>
          <Input placeholder="搜索单号/产品/订单" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 200 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small" bordered style={{ borderTop: '3px solid #2c5282' }}>
            <Statistic title="总入库" value={data.length} valueStyle={{ color: '#2c5282' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bordered style={{ borderTop: '3px solid #fa8c16' }}>
            <Statistic title="待发货" value={countByStatus('待发货')} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bordered style={{ borderTop: '3px solid #1890ff' }}>
            <Statistic title="已发货" value={countByStatus('已发货')} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bordered style={{ borderTop: '3px solid #52c41a' }}>
            <Statistic title="已收货" value={countByStatus('已收货')} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 15 }} scroll={{ x: 1100 }} />

      <Modal title={detail ? `入库详情 - ${detail.entry_no || `#${detail.id}`}` : '入库详情'} open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={640} destroyOnClose>
        {detail && (
          <Descriptions size="small" column={2} bordered>
            <Descriptions.Item label="入库单号">{detail.entry_no || '-'}</Descriptions.Item>
            <Descriptions.Item label="产品名称">{detail.product_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="订单号">{orderMap.get(detail.order_id) || `#${detail.order_id}`}</Descriptions.Item>
            <Descriptions.Item label="工单号">{detail.work_order_id ? (workOrderMap.get(detail.work_order_id) || `#${detail.work_order_id}`) : '-'}</Descriptions.Item>
            <Descriptions.Item label="数量">{detail.quantity ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={STATUS_COLOR[detail.status] || 'default'}>{detail.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="创建日期" span={2}>{detail.created_at?.split('T')[0] || detail.created_at || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{detail.remark || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
