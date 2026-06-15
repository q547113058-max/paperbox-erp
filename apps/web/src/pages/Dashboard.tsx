import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Empty, Segmented, DatePicker, Spin } from 'antd';
import { WarningOutlined, CarOutlined, DollarOutlined, TrophyOutlined, ShoppingCartOutlined, ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import type { Order, Product, Delivery, Customer } from '../types/api';
import api from '../utils/axios';

interface DashboardData {
  purchase: {
    amount: number; mom: number; yoy: number;
    ranking: { name: string; amount: number; qty: number }[];
  };
  order: { amount: number; profit: number; mom: number; yoy: number };
  delivery: { count: number };
  customerAccounts: {
    totalAR: number; totalPaid: number; remaining: number;
    debtorCount: number; receivableCount: number; monthCollected: number;
  };
  monthlyTrend: { month: string; orders: number; purchases: number; profit: number }[];
  totalOrders: number;
  totalProducts: number;
  lowStock: number;
}

const DONUT_COLORS = ['#2c5282', '#e8e8e8'];
const CHART_COLORS = { orders: '#2c5282', purchases: '#d97706', profit: '#389e0d' };

function fmtWan(v: number): string {
  if (v >= 10000) return (v / 10000).toFixed(2) + '万';
  return v.toLocaleString('zh-CN', { minimumFractionDigits: 2 });
}

function formatPercent(v: number): { color: string; icon: React.ReactNode; text: string } {
  if (v > 0) return { color: '#cf1322', icon: <ArrowUpOutlined />, text: `+${v}%` };
  if (v < 0) return { color: '#389e0d', icon: <ArrowDownOutlined />, text: `${v}%` };
  return { color: '#8c8c8c', icon: <MinusOutlined />, text: '0%' };
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [period, setPeriod] = useState<string>('月');
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/reports/dashboard', { params: { date } }),
      api.get('/orders'),
      api.get('/deliveries'),
      api.get('/customers'),
      api.get('/products'),
    ])
      .then(([dRes, oRes, delRes, cRes, pRes]) => {
        setDashboard(dRes.data);
        setOrders(Array.isArray(oRes.data) ? oRes.data : []);
        setDeliveries(Array.isArray(delRes.data) ? delRes.data : []);
        setCustomers(Array.isArray(cRes.data) ? cRes.data : []);
        setProducts(Array.isArray(pRes.data) ? pRes.data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [date]);

  const customerMap = useMemo(() => {
    const m: Record<number, string> = {};
    customers.forEach((c) => { m[c.id] = c.name; });
    return m;
  }, [customers]);

  // 低库存
  const lowStock = products.filter((p) => p.stock_qty < (p.safety_stock || 0)).length;

  // 近期订单
  const recentOrders = orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // 最近送货
  const recentDeliveries = deliveries
    .sort((a, b) => new Date(b.created_at || b.delivery_date || '').getTime() - new Date(a.created_at || a.delivery_date || '').getTime())
    .slice(0, 5);

  const statusColor: Record<string, string> = {
    '待确认': 'default', '已确认': 'blue', '生产中': 'orange',
    '待发货': 'purple', '已完成': 'green', '已取消': 'red',
  };
  const deliveryStatusColor: Record<string, string> = {
    '待发货': 'orange', '已发货': 'blue', '已送达': 'green', '已签收': 'green', '已完成': 'green', '已取消': 'red',
  };

  const orderColumns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', render: (v: string) => v || '-' },
    { title: '客户', dataIndex: 'customer_id', key: 'customer_id', render: (id: number) => customerMap[id] || '未关联' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColor[s] || 'default'}>{s}</Tag> },
    { title: '金额', dataIndex: 'total_amount', key: 'total_amount', render: (v: number) => v ? `¥${v.toLocaleString()}` : '-' },
  ];
  const deliveryColumns = [
    { title: '送货单号', dataIndex: 'delivery_no', key: 'delivery_no' },
    { title: '客户', dataIndex: 'customer_id', key: 'customer_id', render: (id: number) => customerMap[id] || '未关联' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={deliveryStatusColor[s] || 'default'}>{s || '-'}</Tag> },
  ];

  // 环形图数据
  const donutData = dashboard ? [
    { name: '已收款', value: dashboard.customerAccounts.monthCollected },
    { name: '未收', value: Math.max(0, dashboard.customerAccounts.totalAR - dashboard.customerAccounts.monthCollected) },
  ] : [];

  const purchaseMom = dashboard ? formatPercent(dashboard.purchase.mom) : { color: '', icon: null, text: '' };
  const orderMom = dashboard ? formatPercent(dashboard.order.mom) : { color: '', icon: null, text: '' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>概览</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Segmented
            options={['日', '月', '年']}
            value={period}
            onChange={(v) => setPeriod(v as string)}
          />
          <DatePicker
            picker={period === '日' ? 'date' : period === '月' ? 'month' : 'year'}
            value={null}
            onChange={(d) => {
              if (d) setDate(d.format(period === '年' ? 'YYYY' : 'YYYY-MM'));
            }}
            placeholder="选择日期"
          />
        </div>
      </div>

      <Spin spinning={loading}>
        {dashboard && (
          <>
            {/* Row 1: KPI 卡片 */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={4}>
                <Card size="small">
                  <Statistic
                    title="采购金额"
                    value={dashboard.purchase.amount}
                    precision={2}
                    prefix="¥"
                    suffix={<span style={{ fontSize: 13, color: purchaseMom.color }}>{purchaseMom.icon} 环比{purchaseMom.text}</span>}
                    valueStyle={{ color: '#d97706' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small">
                  <Statistic
                    title="订单金额"
                    value={dashboard.order.amount}
                    precision={2}
                    prefix="¥"
                    suffix={<span style={{ fontSize: 13, color: orderMom.color }}>{orderMom.icon} 环比{orderMom.text}</span>}
                    valueStyle={{ color: '#2c5282' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small">
                  <Statistic
                    title="毛利"
                    value={dashboard.order.profit}
                    precision={2}
                    prefix="¥"
                    suffix={<TrophyOutlined />}
                    valueStyle={{ color: dashboard.order.profit >= 0 ? '#389e0d' : '#cf1322' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small">
                  <Statistic
                    title="本月送货"
                    value={dashboard.delivery.count}
                    suffix="单"
                    prefix={<CarOutlined />}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small">
                  <Statistic
                    title="客户账款"
                    value={dashboard.customerAccounts.remaining}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: dashboard.customerAccounts.remaining > 0 ? '#cf1322' : '#389e0d' }}
                  />
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                    应收¥{fmtWan(dashboard.customerAccounts.totalAR)} | 欠款{dashboard.customerAccounts.debtorCount}家
                  </div>
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small">
                  <Statistic
                    title="低库存预警"
                    value={lowStock}
                    valueStyle={{ color: lowStock > 0 ? '#cf1322' : '#389e0d' }}
                    prefix={lowStock > 0 ? <WarningOutlined /> : undefined}
                    suffix="个"
                  />
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                    产品: {products.length} | 订单: {orders.length}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Row 2: 材料排名 + 环形图 + 近期订单 */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card title="材料采购排名" size="small">
                  {dashboard.purchase.ranking.length ? (
                    <Table
                      rowKey="name"
                      size="small"
                      pagination={false}
                      dataSource={dashboard.purchase.ranking}
                      columns={[
                        { title: '排名', key: 'rank', render: (_: unknown, __: unknown, i: number) => i + 1, width: 50 },
                        { title: '材料名称', dataIndex: 'name', key: 'name' },
                        { title: '采购金额', dataIndex: 'amount', key: 'amount', render: (v: number) => `¥${v.toLocaleString()}` },
                        { title: '采购面积', dataIndex: 'area', key: 'area', render: (v: number) => `${fmtWan(v)} m²` },
                      ]}
                    />
                  ) : <Empty description="暂无采购数据" />}
                </Card>
              </Col>
              <Col span={6}>
                <Card title="当月收款" size="small">
                  {donutData[0]?.value > 0 || donutData[1]?.value > 0 ? (
                    <div style={{ textAlign: 'center' }}>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value">
                            {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ marginTop: -30, fontSize: 18, fontWeight: 600, color: '#2c5282' }}>
                        ¥{dashboard.customerAccounts.monthCollected.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        应收 ¥{fmtWan(dashboard.customerAccounts.totalAR)} | 已收 ¥{dashboard.customerAccounts.totalPaid.toLocaleString()}
                      </div>
                    </div>
                  ) : <Empty description="暂无收款数据" />}
                </Card>
              </Col>
              <Col span={6}>
                <Card title="近期订单" size="small">
                  {recentOrders.length ? (
                    <Table rowKey="id" size="small" pagination={false} columns={orderColumns} dataSource={recentOrders} />
                  ) : <Empty description="暂无订单" />}
                </Card>
              </Col>
            </Row>

            {/* Row 3: 趋势图 + 送货 */}
            <Row gutter={16}>
              <Col span={16}>
                <Card title="月度趋势" size="small">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dashboard.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="orders" name="订单" fill={CHART_COLORS.orders} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="purchases" name="采购" fill={CHART_COLORS.purchases} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" name="毛利" fill={CHART_COLORS.profit} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="最近送货" size="small">
                  {recentDeliveries.length ? (
                    <Table rowKey="id" size="small" pagination={false} columns={deliveryColumns} dataSource={recentDeliveries} />
                  ) : <Empty description="暂无送货记录" />}
                </Card>
              </Col>
            </Row>
          </>
        )}
        {!dashboard && !loading && <Empty description="暂无数据" />}
      </Spin>
    </div>
  );
}
