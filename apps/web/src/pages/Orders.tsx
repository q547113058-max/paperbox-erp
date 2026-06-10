import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Tag, Popconfirm, message, Modal, Form, InputNumber, Select, DatePicker, Row, Col, Divider, Card, Statistic } from 'antd';
import {
  EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined,
  SearchOutlined, DownloadOutlined, PrinterOutlined, CheckOutlined, StopOutlined,
  CarOutlined, ToolOutlined, InboxOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import type { Order, Customer, Product } from '../types/api';
import api from '../utils/axios';
import dayjs from 'dayjs';
import { TableEmptyCell } from '../components/TableEmptyCell';
import { getStatusColor } from '../utils/statusColor';

const STATUS_OPTIONS = ['待确认', '已确认', '生产中', '待发货', '已完成', '已取消'];
const STATUS_COLOR: Record<string, string> = {
  '待确认': 'default', '已确认': 'blue', '生产中': 'orange',
  '待发货': 'purple', '已完成': 'green', '已取消': 'red',
};

/**
 * 订单管理（P0 业务页）
 *
 * 业务闭环：
 *   1. 新建订单（待确认，含产品明细行）
 *   2. 编辑订单（产品明细可增删改）
 *   3. 详情查看（11 字段基本信息 + 38 字段纸箱行业核心数据 + 产品明细表）
 *   4. 状态推进（待确认 → 已确认 → 生产中 → 待发货 → 已完成）
 *   5. 状态切换下拉（行内快速推进）
 *   6. 删除订单（限非已完成）
 *   7. 跳转发货/工单（在详情页内一键跳转）
 *
 * 后端端点（5 个）：
 *   GET    /api/orders                  列表
 *   GET    /api/orders/:id              详情（含 items）
 *   POST   /api/orders                  创建
 *   PUT    /api/orders/:id              更新
 *   PUT    /api/orders/:id/status       状态切换
 *   DELETE /api/orders/:id              删除
 *   PUT    /api/orders/items/:id/manual-close  手动结单
 */

export default function Orders() {
  const [data, setData] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterCustomer, setFilterCustomer] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [form] = Form.useForm();

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/orders'),
      api.get('/customers').catch(() => ({ data: [] })),
      api.get('/products').catch(() => ({ data: [] })),
    ])
      .then(([o, c, p]) => {
        setData(o.data || []);
        setCustomers(c.data || []);
        setProducts(p.data || []);
      })
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c.name || c.contact]));
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const filtered = data.filter((o) => {
    if (keyword) {
      const k = keyword.toLowerCase();
      if (!((o.order_no || '').toLowerCase().includes(k)) &&
          !((o.customer_order_no || '').toLowerCase().includes(k)) &&
          !(customerMap[o.customer_id] || '').toLowerCase().includes(k)) return false;
    }
    if (filterStatus && o.status !== filterStatus) return false;
    if (filterCustomer && o.customer_id !== filterCustomer) return false;
    return true;
  });

  // KPI 统计
  const kpi = {
    total: data.length,
    pending: data.filter((o) => o.status === '待确认').length,
    producing: data.filter((o) => o.status === '生产中').length,
    shipping: data.filter((o) => o.status === '待发货').length,
    totalAmount: data
      .filter((o) => o.status !== '已取消')
      .reduce((s, o) => s + Number(o.total_amount || 0), 0),
  };

  const handleCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ status: '待确认', items: [{ product_id: undefined, quantity: 1, unit_price: 0 }] }); setModalOpen(true); };
  const handleEdit = async (o: Order) => {
    setEditing(o);
    setModalOpen(true);
    try {
      const res = await api.get(`/orders/${o.id}`);
      const full = res.data || o;
      form.setFieldsValue({
        ...full,
        delivery_date: full.delivery_date ? dayjs(full.delivery_date) : null,
        order_date: full.order_date ? dayjs(full.order_date) : null,
        items: (full.items && full.items.length > 0) ? full.items : [{ product_id: undefined, quantity: 1, unit_price: 0 }],
      });
    } catch {
      form.setFieldsValue({
        ...o,
        delivery_date: o.delivery_date ? dayjs(o.delivery_date) : null,
        order_date: o.order_date ? dayjs(o.order_date) : null,
        items: [{ product_id: undefined, quantity: 1, unit_price: 0 }],
      });
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      // 计算总金额 = 各项 amount 之和
      const items = (values.items || []).map((it: any) => ({
        ...it,
        amount: Number(it.quantity || 0) * Number(it.unit_price || 0),
      }));
      const total = items.reduce((s: number, it: any) => s + Number(it.amount || 0), 0);
      const payload = {
        ...values,
        order: {
          ...values,
          total_amount: total,
          delivery_date: values.delivery_date?.format('YYYY-MM-DD'),
          order_date: values.order_date?.format('YYYY-MM-DD'),
        },
        items,
        total_amount: total,
        delivery_date: values.delivery_date?.format('YYYY-MM-DD'),
        order_date: values.order_date?.format('YYYY-MM-DD'),
      };
      if (editing) { await api.put(`/orders/${editing.id}`, payload); message.success('更新成功'); }
      else { await api.post('/orders', payload); message.success('创建成功'); }
      setModalOpen(false);
      fetchAll();
    } catch (e: any) { if (!e.errorFields) message.error(e?.response?.data?.message || '保存失败'); }
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/orders/${id}`); message.success('已删除'); fetchAll(); } catch (e: any) { message.error(e?.response?.data?.message || '删除失败'); }
  };

  const handleViewDetail = async (o: Order) => {
    setDetail(null);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await api.get(`/orders/${o.id}`);
      setDetail(res.data);
    } catch (e: any) {
      message.error('加载详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (o: Order, status: string) => {
    try {
      await api.put(`/orders/${o.id}/status`, { status });
      message.success(`状态已更新为：${status}`);
      fetchAll();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '状态更新失败');
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) { message.warning('当前筛选无数据'); return; }
    const headers = ['订单号', '客户', '客户单号', '总金额', '成本', '利润', '状态', '交货日期', '业务员', '下单日期'];
    const rows = filtered.map((o) => [
      o.order_no || `TMP-${o.id}`,
      customerMap[o.customer_id] || `ID:${o.customer_id}`,
      o.customer_order_no || '',
      Number(o.total_amount || 0).toFixed(2),
      Number(o.total_cost || 0).toFixed(2),
      Number(o.profit || 0).toFixed(2),
      o.status,
      o.delivery_date || '',
      o.salesman_id || '',
      o.order_date || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `订单-${dayjs().format('YYYYMMDD-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`已导出 ${filtered.length} 条`);
  };

  const handleGenerateWorkOrder = async (o: Order) => {
    try {
      const res = await api.post('/work_orders/from-order', { order_id: o.id });
      message.success(`工单已生成：${res.data?.work_order_no || `#${res.data?.id}`}`);
      fetchAll();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '生成工单失败');
    }
  };

  const handleGenerateDelivery = async (o: Order) => {
    try {
      const full = await api.get(`/orders/${o.id}`);
      const orderItems = full.data?.items || [];
      if (orderItems.length === 0) {
        message.warning('该订单没有产品明细，无法生成发货单');
        return;
      }
      const res = await api.post('/deliveries/from-order', {
        order_id: o.id,
        items: orderItems.map((it: any) => ({ product_id: it.product_id, quantity: it.quantity })),
      });
      message.success(`发货单已生成：${res.data?.delivery_no}`);
      fetchAll();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '生成发货单失败');
    }
  };

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 130, fixed: 'left' as const, render: (v: string | null, r: Order) => v ? v : <Tag color="orange">TMP-{r.id}</Tag> },
    { title: '客户', dataIndex: 'customer_id', key: 'customer', width: 120, render: (id: number) => customerMap[id] || `ID:${id}` },
    { title: '业务员', dataIndex: 'salesman_id', key: 'salesman', width: 80, render: (v: number) => v ? `ID:${v}` : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 110, render: (s: string, r: Order) => (
        <Select
          size="small"
          value={s}
          style={{ width: 100 }}
          options={STATUS_OPTIONS.map((x) => ({ value: x, label: <Tag color={getStatusColor(x)} style={{ margin: 0 }}>{x}</Tag> }))}
          onChange={(v) => handleStatusChange(r, v)}
        />
      ),
    },
    { title: '总金额', dataIndex: 'total_amount', key: 'total_amount', width: 110, align: 'right' as const, render: (v: number) => <span style={{ fontWeight: 600, color: Number(v) > 0 ? '#cf1322' : undefined }}>¥{Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span> },
    { title: '成本', dataIndex: 'total_cost', key: 'total_cost', width: 100, align: 'right' as const, render: (v: number) => `¥${Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` },
    { title: '利润', dataIndex: 'profit', key: 'profit', width: 100, align: 'right' as const, render: (v: number) => <span style={{ color: Number(v) >= 0 ? '#52c41a' : '#cf1322' }}>¥{Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span> },
    { title: '客户单号', dataIndex: 'customer_order_no', key: 'customer_order_no', width: 110, render: (v: string) => v || '-' },
    { title: '交货日期', dataIndex: 'delivery_date', key: 'delivery_date', width: 110, render: (v: string) => v || '-' },
    { title: '订单日期', dataIndex: 'order_date', key: 'order_date', width: 110, render: (v: string) => v || '-' },
    { title: '创建日期', dataIndex: 'created_at', key: 'created_at', width: 110, render: (v: string) => v?.split('T')[0] || v },
    {
      title: '操作', key: 'action', width: 320, fixed: 'right' as const,
      render: (_: any, r: Order) => (
        <Space size={4} wrap>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>详情</Button>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
          {r.status === '已确认' && (
            <Button size="small" type="link" icon={<ToolOutlined />} onClick={() => handleGenerateWorkOrder(r)}>生成工单</Button>
          )}
          {r.status === '已完成' || r.status === '已取消' ? null : (
            <Button size="small" type="link" icon={<CarOutlined />} onClick={() => handleGenerateDelivery(r)}>生成发货</Button>
          )}
          {r.status !== '已完成' && r.status !== '已取消' && (
            <Button size="small" type="link" icon={<PrinterOutlined />} onClick={() => message.info('打印功能：打开 /api/print/order/' + r.id)}>打印</Button>
          )}
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>订单管理</h2>
        <Space>
          <Input placeholder="搜索订单号/客户/客户单号" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 240 }} allowClear prefix={<SearchOutlined />} />
          <Button icon={<ReloadOutlined />} onClick={fetchAll}>刷新</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>导出 ({filtered.length})</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新建订单</Button>
        </Space>
      </div>

      {/* KPI 卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}>
          <Card size="small" style={{ borderTop: '3px solid #2c5282' }}>
            <Statistic title="总订单" value={kpi.total} valueStyle={{ color: '#2c5282' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" style={{ borderTop: '3px solid #faad14' }}>
            <Statistic title="待确认" value={kpi.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" style={{ borderTop: '3px solid #fa8c16' }}>
            <Statistic title="生产中" value={kpi.producing} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" style={{ borderTop: '3px solid #722ed1' }}>
            <Statistic title="待发货" value={kpi.shipping} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ borderTop: '3px solid #cf1322' }}>
            <Statistic title="总金额" value={kpi.totalAmount} precision={2} prefix="¥" valueStyle={{ color: '#cf1322', fontSize: 18 }} />
          </Card>
        </Col>
      </Row>

      {/* 筛选条 */}
      <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span>状态：</span>
        <Select allowClear placeholder="全部状态" value={filterStatus} onChange={setFilterStatus} style={{ width: 140 }} options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
        <span>客户：</span>
        <Select
          allowClear showSearch placeholder="全部客户" value={filterCustomer} onChange={setFilterCustomer}
          style={{ width: 180 }} optionFilterProp="label"
          options={customers.map((c) => ({ value: c.id, label: c.name || c.contact || `ID:${c.id}` }))}
        />
        <Button size="small" onClick={() => { setKeyword(''); setFilterStatus(null); setFilterCustomer(null); }}>清除筛选</Button>
      </div>

      <Table
        rowKey="id"
        size="small"
        loading={loading}
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 1600 }}
        locale={{
          emptyText: (
            <TableEmptyCell
              resource="订单"
              actionText="新建订单"
              onAction={handleCreate}
              keyword={keyword}
              isDataEmpty={data.length === 0}
            />
          ),
        }}
      />

      <Modal title={editing ? '编辑订单' : '新建订单'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} width={960} okText="保存" cancelText="取消" destroyOnClose styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}>
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>基本信息</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="order_no" label="订单号"><Input placeholder="自动生成" /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="customer_id" label="客户" rules={[{ required: true, message: '请选择客户' }]}>
                <Select
                  showSearch
                  placeholder="选择客户"
                  optionFilterProp="label"
                  options={customers.map((c) => ({ value: c.id, label: c.name || c.contact || `ID:${c.id}` }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="状态" initialValue="待确认">
                <Select options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>日期与单号</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="order_date" label="订单日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="delivery_date" label="交货日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="customer_order_no" label="客户单号"><Input placeholder="客户单号" /></Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>金额</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="total_amount" label="总金额 (元)"><InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="total_cost" label="总成本 (元)"><InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="profit" label="利润 (元)"><InputNumber step={0.01} style={{ width: '100%' }} placeholder="0.00" /></Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>产品明细</Divider>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                    <Col span={7}>
                      <Form.Item {...restField} name={[name, 'product_id']} rules={[{ required: true, message: '请选择产品' }]} style={{ marginBottom: 0 }}>
                        <Select
                          showSearch
                          placeholder="产品"
                          optionFilterProp="label"
                          options={products.map((p) => ({
                            value: p.id,
                            label: `${p.code || ''} ${p.name || ''} ${p.spec || ''}`,
                          }))}
                          onChange={(productId) => {
                            const p = productMap[productId];
                            const items = form.getFieldValue('items') || [];
                            items[name] = {
                              ...items[name],
                              product_id: productId,
                              unit_price: items[name]?.unit_price ?? Number(p?.unit_price || 0),
                              customer_product_code: items[name]?.customer_product_code || p?.code || '',
                            };
                            form.setFieldsValue({ items });
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true, message: '数量' }]} style={{ marginBottom: 0 }}>
                        <InputNumber min={1} style={{ width: '100%' }} placeholder="数量" />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item {...restField} name={[name, 'unit_price']} style={{ marginBottom: 0 }}>
                        <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="单价" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item {...restField} name={[name, 'customer_product_code']} style={{ marginBottom: 0 }}>
                        <Input placeholder="客户产品编号" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item {...restField} name={[name, 'delivery_date']} style={{ marginBottom: 0 }}>
                        <Input placeholder="交期 YYYY-MM-DD" />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item {...restField} name={[name, 'remark']} style={{ marginBottom: 0 }}>
                        <Input placeholder="备注" />
                      </Form.Item>
                    </Col>
                    <Col span={1}>
                      <Button size="small" danger type="link" icon={<DeleteOutlined />} onClick={() => remove(name)} />
                    </Col>
                  </Row>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ quantity: 1, unit_price: 0 })} block>
                  添加产品明细
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item name="remark" label="备注" style={{ marginTop: 16 }}><Input.TextArea rows={2} placeholder="备注信息" /></Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title={`订单详情 - ${detail?.order_no || `TMP-${detail?.id}`}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        width={960}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>关闭</Button>,
        ]}
      >
        {detail && (
          <>
            <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b' }}>基本信息</Divider>
            <Row gutter={[16, 8]}>
              <Col span={6}><b>订单号：</b>{detail.order_no || `TMP-${detail.id}`}</Col>
              <Col span={6}><b>客户：</b>{customerMap[detail.customer_id] || `ID:${detail.customer_id}`}</Col>
              <Col span={6}><b>业务员：</b>{detail.salesman_id || '-'}</Col>
              <Col span={6}><b>状态：</b><Tag color={getStatusColor(detail.status)}>{detail.status}</Tag></Col>
              <Col span={6}><b>客户单号：</b>{detail.customer_order_no || '-'}</Col>
              <Col span={6}><b>下单日期：</b>{detail.order_date || '-'}</Col>
              <Col span={6}><b>交货日期：</b>{detail.delivery_date || '-'}</Col>
              <Col span={6}><b>创建日期：</b>{(detail.created_at || '').split('T')[0]}</Col>
              <Col span={6}><b>印刷名：</b>{detail.print_name || '-'}</Col>
              <Col span={6}><b>客户尺寸：</b>{detail.customer_size || '-'}</Col>
              <Col span={6}><b>刀模尺寸：</b>{detail.die_size || '-'}</Col>
              <Col span={6}><b>数量(总)：</b>{detail.quantity || '-'}</Col>
            </Row>

            <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b' }}>面纸（中纸/里纸）</Divider>
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <b>面纸：</b>
                {detail.face_supplier || '-'} / {detail.face_material || '-'} / {detail.face_size || '-'} / {detail.face_qty || '-'} 张
                <br />
                单价 ¥{detail.face_price || 0} / 加价 ¥{detail.face_fee || 0}
              </Col>
              <Col span={12}>
                <b>中纸：</b>
                {detail.medium_supplier || '-'} / {detail.medium_material || '-'} / {detail.medium_weight || '-'}g / {detail.medium_size || '-'} / {detail.medium_qty || '-'} 张
                <br />
                单价 ¥{detail.medium_price || 0}
              </Col>
            </Row>

            <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b' }}>印刷/表面处理/刀模</Divider>
            <Row gutter={[16, 8]}>
              <Col span={6}><b>印刷色数：</b>{detail.print_color || '-'} 色</Col>
              <Col span={6}><b>印刷单价：</b>¥{detail.print_price || 0}</Col>
              <Col span={6}><b>表面处理：</b>{detail.surface_process || '-'}</Col>
              <Col span={6}><b>表面单价：</b>¥{detail.surface_price || 0}</Col>
              <Col span={6}><b>刀模单价：</b>¥{detail.die_price || 0}</Col>
              <Col span={6}><b>委外费：</b>¥{detail.outsource_fee || 0}</Col>
              <Col span={12}><b>参考信息：</b>{detail.reference_info || '-'}</Col>
              <Col span={24}><b>客户反馈：</b>{detail.customer_feedback || '-'}</Col>
            </Row>

            <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b' }}>金额</Divider>
            <Row gutter={[16, 8]}>
              <Col span={6}><b>含税成本：</b>¥{detail.cost_tax || 0}</Col>
              <Col span={6}><b>不含税成本：</b>¥{detail.cost_no_tax || 0}</Col>
              <Col span={6}><b>含税单价：</b>¥{detail.price_tax || 0}</Col>
              <Col span={6}><b>不含税单价：</b>¥{detail.price_no_tax || 0}</Col>
              <Col span={6}><b>总金额（含税）：</b>¥{detail.total_tax || 0}</Col>
              <Col span={6}><b>总金额（不含税）：</b>¥{detail.total_no_tax || 0}</Col>
              <Col span={6}><b>利润率：</b>{detail.profit_margin || 0}%</Col>
              <Col span={6}><b>实际利润：</b><span style={{ color: Number(detail.profit) >= 0 ? '#52c41a' : '#cf1322' }}>¥{Number(detail.profit || 0).toFixed(2)}</span></Col>
            </Row>

            <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b' }}>产品明细</Divider>
            <Table
              size="small"
              rowKey="id"
              loading={detailLoading}
              dataSource={detail.items || []}
              pagination={false}
              columns={[
                { title: '产品', dataIndex: 'product_id', width: 200, render: (id: number) => {
                    const p = productMap[id];
                    if (!p) return `ID:${id}`;
                    return <span><Tag color="blue">{p.code}</Tag>{p.name}</span>;
                  } },
                { title: '规格', key: 'spec', width: 120, render: (_: any, r: any) => productMap[r.product_id]?.spec || '-' },
                { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' as const },
                { title: '已发货', dataIndex: 'delivered_qty', width: 80, align: 'right' as const,
                  render: (v: number) => v > 0 ? <span style={{ color: '#52c41a' }}>{v}</span> : '-' },
                { title: '单价', dataIndex: 'unit_price', width: 90, align: 'right' as const, render: (v: number) => `¥${Number(v || 0).toFixed(2)}` },
                { title: '金额', dataIndex: 'amount', width: 110, align: 'right' as const, render: (v: number) => <b style={{ color: '#cf1322' }}>¥{Number(v || 0).toFixed(2)}</b> },
                { title: '客户产品编号', dataIndex: 'customer_product_code', width: 120, render: (v: string) => v || '-' },
                { title: '交期', dataIndex: 'delivery_date', width: 110, render: (v: string) => v || '-' },
                { title: '备注', dataIndex: 'remark', ellipsis: true },
              ]}
              summary={(items) => {
                const totalQty = items.reduce((s, i) => s + Number(i.quantity || 0), 0);
                const totalDelivered = items.reduce((s, i) => s + Number(i.delivered_qty || 0), 0);
                const totalAmt = items.reduce((s, i) => s + Number(i.amount || 0), 0);
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 600 }}>
                      <Table.Summary.Cell index={0}>合计（{items.length} 项）</Table.Summary.Cell>
                      <Table.Summary.Cell index={1} />
                      <Table.Summary.Cell index={2} align="right">{totalQty}</Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right"><span style={{ color: '#52c41a' }}>{totalDelivered}</span></Table.Summary.Cell>
                      <Table.Summary.Cell index={4} />
                      <Table.Summary.Cell index={5} align="right">¥{totalAmt.toFixed(2)}</Table.Summary.Cell>
                      <Table.Summary.Cell index={6} />
                      <Table.Summary.Cell index={7} />
                      <Table.Summary.Cell index={8} />
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />

            <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b' }}>备注</Divider>
            <div style={{ padding: '0 0 16px', color: '#475569' }}>{detail.remark || '-'}</div>
          </>
        )}
      </Modal>
    </div>
  );
}
