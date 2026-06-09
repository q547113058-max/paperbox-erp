import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import type { Order, Product } from '../types/api';
import api from '../utils/axios';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/products'), api.get('/orders')])
      .then(([p, o]) => {
        setProducts(p.data);
        setOrders(o.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pendingDeliveries = orders.filter((o) => o.status === '待发货' || o.status === '生产中').length;
  const lowStock = products.filter((p) => p.stock_qty < (p.safety_stock || 0)).length;
  const totalAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const recentOrders = orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const statusColor: Record<string, string> = {
    '待确认': 'default',
    '已确认': 'blue',
    '生产中': 'orange',
    '待发货': 'purple',
    '已完成': 'green',
    '已取消': 'red',
  };

  const orderColumns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', render: (v: string) => v || '-' },
    { title: '客户ID', dataIndex: 'customer_id', key: 'customer_id' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColor[s] || 'default'}>{s}</Tag> },
    { title: '总金额', dataIndex: 'total_amount', key: 'total_amount', render: (v: number) => `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` },
    { title: '交货日期', dataIndex: 'delivery_date', key: 'delivery_date' },
    { title: '创建日期', dataIndex: 'created_at', key: 'created_at', render: (v: string) => v?.split('T')[0] || v },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>概览</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="产品数量" value={products.length} loading={loading} /></Card></Col>
        <Col span={6}><Card><Statistic title="订单数量" value={orders.length} loading={loading} /></Card></Col>
        <Col span={6}><Card><Statistic title="待生产/待发货" value={pendingDeliveries} loading={loading} /></Card></Col>
        <Col span={6}><Card><Statistic title="低库存产品" value={lowStock} loading={loading} valueStyle={{ color: lowStock > 0 ? '#cf1322' : undefined }} /></Card></Col>
      </Row>

      <Card title="近期订单" loading={loading}>
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          columns={orderColumns}
          dataSource={recentOrders}
        />
      </Card>
    </div>
  );
}
