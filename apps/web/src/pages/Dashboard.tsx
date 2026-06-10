import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Empty } from 'antd';
import { WarningOutlined, CarOutlined, DollarOutlined, TrophyOutlined } from '@ant-design/icons';
import type { Order, Product, Delivery, Customer } from '../types/api';
import api from '../utils/axios';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/products'),
      api.get('/orders'),
      api.get('/deliveries'),
      api.get('/customers'),
    ])
      .then(([p, o, d, c]) => {
        setProducts(p.data);
        setOrders(o.data);
        setDeliveries(d.data);
        setCustomers(c.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const customerMap = useMemo(() => {
    const m: Record<number, string> = {};
    customers.forEach((c) => { m[c.id] = c.name; });
    return m;
  }, [customers]);

  // --- KPI ---
  const pendingDeliveries = orders.filter((o) => o.status === '待发货' || o.status === '生产中').length;
  const lowStock = products.filter((p) => p.stock_qty < (p.safety_stock || 0)).length;

  const now = new Date();
  const monthOrders = orders.filter((o) => {
    if (!o.created_at) return false;
    const d = new Date(o.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const monthRevenue = monthOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const monthProfit = monthOrders.reduce((s, o) => s + (o.profit || 0), 0);

  // --- 库存预警 ---
  const lowStockProducts = products
    .filter((p) => p.stock_qty < (p.safety_stock || 0))
    .sort((a, b) => a.stock_qty / (a.safety_stock || 1) - b.stock_qty / (b.safety_stock || 1));

  // --- 近期订单 ---
  const recentOrders = orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // --- 最近送货 ---
  const recentDeliveries = deliveries
    .sort((a, b) => new Date(b.created_at || b.delivery_date || '').getTime() - new Date(a.created_at || a.delivery_date || '').getTime())
    .slice(0, 5);

  // --- Status color maps ---
  const statusColor: Record<string, string> = {
    '待确认': 'default',
    '已确认': 'blue',
    '生产中': 'orange',
    '待发货': 'purple',
    '已完成': 'green',
    '已取消': 'red',
  };

  const deliveryStatusColor: Record<string, string> = {
    '待发货': 'orange',
    '已发货': 'blue',
    '已送达': 'green',
    '已签收': 'green',
    '已完成': 'green',
    '已取消': 'red',
  };

  // --- Column definitions ---
  const orderColumns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', render: (v: string) => v || '-' },
    { title: '客户', dataIndex: 'customer_id', key: 'customer_id', render: (id: number) => customerMap[id] || '未关联' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColor[s] || 'default'}>{s}</Tag> },
    { title: '总金额', dataIndex: 'total_amount', key: 'total_amount', render: (v: number) => v ? `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : '-' },
    { title: '创建日期', dataIndex: 'created_at', key: 'created_at', render: (v: string) => v?.split('T')[0] || '-' },
  ];

  const deliveryColumns = [
    { title: '送货单号', dataIndex: 'delivery_no', key: 'delivery_no', render: (v: string) => v || '-' },
    { title: '客户', dataIndex: 'customer_id', key: 'customer_id', render: (id: number) => customerMap[id] || '未关联' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={deliveryStatusColor[s] || 'default'}>{s || '-'}</Tag> },
    { title: '送货日期', dataIndex: 'delivery_date', key: 'delivery_date', render: (v: string) => v?.split('T')[0] || '-' },
    { title: '签收', key: 'signed', render: (_: unknown, r: Delivery) => r.signed_at ? <Tag color="green">已签收</Tag> : <Tag color="default">未签收</Tag> },
  ];

  const lowStockColumns = [
    { title: '产品', dataIndex: 'name', key: 'name', render: (v: string) => v || '-' },
    { title: '当前库存', dataIndex: 'stock_qty', key: 'stock_qty', render: (v: number) => <span style={{ color: '#cf1322', fontWeight: 600 }}>{v}</span> },
    { title: '安全库存', dataIndex: 'safety_stock', key: 'safety_stock' },
    { title: '库存率', key: 'ratio', render: (_: unknown, r: Product) => {
      const pct = r.safety_stock ? Math.round((r.stock_qty / r.safety_stock) * 100) : 0;
      return <span style={{ color: pct < 50 ? '#cf1322' : '#d48806' }}>{pct}%</span>;
    }},
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>概览</h2>

      {/* KPI 卡片 - 6 张 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}><Card><Statistic title="产品数量" value={products.length} loading={loading} /></Card></Col>
        <Col span={4}><Card><Statistic title="订单数量" value={orders.length} loading={loading} /></Card></Col>
        <Col span={4}><Card><Statistic title="待生产/待发货" value={pendingDeliveries} loading={loading} /></Card></Col>
        <Col span={4}><Card><Statistic title="低库存产品" value={lowStock} loading={loading} valueStyle={{ color: lowStock > 0 ? '#cf1322' : undefined }} prefix={lowStock > 0 ? <WarningOutlined /> : undefined} /></Card></Col>
        <Col span={4}><Card><Statistic title="本月收入" value={monthRevenue} loading={loading} precision={2} prefix="¥" suffix={<DollarOutlined />} valueStyle={{ color: '#2c5282' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="本月利润" value={monthProfit} loading={loading} precision={2} prefix="¥" suffix={<TrophyOutlined />} valueStyle={{ color: monthProfit >= 0 ? '#389e0d' : '#cf1322' }} /></Card></Col>
      </Row>

      {/* 下半部分：左列（近期订单 + 最近送货），右列（库存预警） */}
      <Row gutter={16}>
        <Col span={14}>
          <Card title="近期订单" loading={loading} style={{ marginBottom: 16 }}>
            {recentOrders.length ? (
              <Table rowKey="id" size="small" pagination={false} columns={orderColumns} dataSource={recentOrders} />
            ) : (
              <Empty description="暂无订单" />
            )}
          </Card>
          <Card title="最近送货" loading={loading}>
            {recentDeliveries.length ? (
              <Table rowKey="id" size="small" pagination={false} columns={deliveryColumns} dataSource={recentDeliveries} />
            ) : (
              <Empty description="暂无送货记录" />
            )}
          </Card>
        </Col>
        <Col span={10}>
          <Card title="库存预警" loading={loading}>
            {lowStockProducts.length ? (
              <Table rowKey="id" size="small" pagination={false} columns={lowStockColumns} dataSource={lowStockProducts} />
            ) : (
              <Empty description="库存充足" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
