import React, { useEffect, useMemo, useState } from 'react';
import {
  Table, Input, Button, Space, Tag, message, Modal, Form,
  Select, DatePicker, InputNumber, Popconfirm,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, ReloadOutlined,
  SearchOutlined, DownloadOutlined, EyeOutlined, CarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Delivery, Order, Product, Customer } from '../types/api';
import api from '../utils/axios';
import { TableEmptyCell } from '../components/TableEmptyCell';
import { getStatusColor } from '../utils/statusColor';

interface DeliveryItemRow {
  key: string;
  product_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  remark: string;
}

export default function Deliveries() {
  const [data, setData] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [items, setItems] = useState<DeliveryItemRow[]>([]);
  const [searchProductId, setSearchProductId] = useState<number | null>(null);
  const [addQty, setAddQty] = useState<number>(1);
  const [addPrice, setAddPrice] = useState<number>(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/deliveries'),
      api.get('/orders').catch(() => ({ data: [] })),
      api.get('/products').catch(() => ({ data: [] })),
      api.get('/customers').catch(() => ({ data: [] })),
    ]).then(([d, o, p, c]) => {
      setData(d.data || []);
      setOrders(o.data || []);
      setProducts(p.data || []);
      setCustomers(c.data || []);
    }).catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const orderMap = useMemo(() => Object.fromEntries(orders.map(o => [o.id, o.order_no || `#${o.id}`])), [orders]);
  const customerMap = useMemo(() => Object.fromEntries(customers.map(c => [c.id, c.name || c.contact || '-'])), [customers]);
  const productOptions = useMemo(() =>
    products.map(p => ({
      value: p.id,
      label: `${p.name || ''} [${p.code || ''}]`.trim(),
    })), [products]);

  const filtered = useMemo(() => data.filter(d => {
    if (keyword) {
      const k = keyword.toLowerCase();
      if (!(d.delivery_no || '').toLowerCase().includes(k) &&
          !(d.delivery_person || '').toLowerCase().includes(k)) return false;
    }
    if (filterStatus && d.status !== filterStatus) return false;
    return true;
  }), [data, keyword, filterStatus]);

  const kpi = useMemo(() => ({
    total: data.length,
    pending: data.filter(d => d.status === '待发货').length,
    shipped: data.filter(d => d.status === '已发货').length,
    signed: data.filter(d => d.status === '已签收').length,
  }), [data]);

  // 明细操作
  const handleAddItem = () => {
    if (!searchProductId) { message.warning('请选择产品'); return; }
    const product = products.find(p => p.id === searchProductId);
    const newItem: DeliveryItemRow = {
      key: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      product_id: searchProductId,
      product_name: product?.name || '',
      quantity: addQty || 1,
      unit_price: addPrice || 0,
      remark: '',
    };
    setItems(prev => [...prev, newItem]);
    setSearchProductId(null);
    setAddQty(1);
    setAddPrice(0);
  };

  const handleRemoveItem = (key: string) => setItems(prev => prev.filter(it => it.key !== key));

  // 弹窗
  const openCreate = () => {
    form.resetFields();
    setItems([]);
    setSearchProductId(null);
    setAddQty(1);
    setAddPrice(0);
    setModalOpen(true);
  };

  // 选订单时自动加载其产品明细
  const handleOrderChange = async (orderId: number) => {
    if (!orderId) { setItems([]); return; }
    try {
      const res = await api.get(`/orders/${orderId}`);
      const orderItems = res.data?.items || [];
      const autoItems: DeliveryItemRow[] = orderItems.map((it: any, idx: number) => ({
        key: `auto_${idx}`,
        product_id: it.product_id,
        product_name: products.find(p => p.id === it.product_id)?.name || '',
        quantity: it.quantity || 0,
        unit_price: it.unit_price || 0,
        remark: '',
      }));
      setItems(autoItems);
    } catch { setItems([]); }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!values.order_id) { message.error('请选择关联订单'); return; }
      if (items.length === 0) { message.warning('请添加发货产品'); return; }

      await api.post('/deliveries/from-order', {
        order_id: Number(values.order_id),
        delivery_date: values.delivery_date?.format?.('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
        address: values.address || '',
        remark: values.remark || '',
        items: items.map(it => ({
          product_id: it.product_id,
          quantity: it.quantity,
        })),
      });
      message.success('发货单创建成功');
      setModalOpen(false);
      fetchAll();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message || '创建失败');
    }
  };

  // 业务操作
  const handleShip = async (d: Delivery) => {
    Modal.confirm({
      title: `发货确认 - ${d.delivery_no || `#${d.id}`}`,
      content: <Input id="ship-person" placeholder="送货人" defaultValue={d.delivery_person || ''} />,
      onOk: async () => {
        const person = (document.getElementById('ship-person') as HTMLInputElement)?.value;
        if (!person) { message.warning('请填写送货人'); return Promise.reject(); }
        try {
          await api.put(`/deliveries/${d.id}/ship`, { delivery_person: person, delivery_time: new Date().toISOString().replace('T', ' ').slice(0, 19) });
          message.success('已发货'); fetchAll();
        } catch (e: any) { message.error(e?.response?.data?.message || '发货失败'); }
      },
    });
  };

  const handleSign = async (d: Delivery) => {
    Modal.confirm({
      title: `客户签收 - ${d.delivery_no || `#${d.id}`}`,
      content: <Input.TextArea id="sign-remark" rows={2} placeholder="签收备注" />,
      onOk: async () => {
        const remark = (document.getElementById('sign-remark') as HTMLTextAreaElement)?.value || '';
        try { await api.post(`/deliveries/${d.id}/sign`, { remark }); message.success('已签收'); fetchAll(); }
        catch (e: any) { message.error(e?.response?.data?.message || '签收失败'); }
      },
    });
  };

  const handleDelete = async (d: Delivery) => {
    try { await api.delete(`/deliveries/${d.id}`); message.success('已删除'); fetchAll(); }
    catch (e: any) { message.error(e?.response?.data?.message || '删除失败'); }
  };

  // 查看详情（含明细）
  const openDetail = async (d: Delivery) => {
    try {
      const res = await api.get(`/deliveries/by-no/${d.delivery_no || d.id}`);
      setDetailData(res.data);
      setDetailOpen(true);
    } catch { message.error('加载详情失败'); }
  };

  const handleExport = () => {
    if (!filtered.length) { message.warning('无数据'); return; }
    const headers = ['发货单号', '关联订单', '客户', '送货人', '状态', '送货日期'];
    const rows = filtered.map(d => [
      d.delivery_no || `#${d.id}`, orderMap[d.order_id] || '-', customerMap[d.customer_id] || '-',
      d.delivery_person || '', d.status, d.delivery_date || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `送货单-${dayjs().format('YYYYMMDD-HHmm')}.csv`; a.click();
  };

  const columns = [
    {
      title: '发货单号', dataIndex: 'delivery_no', width: 160, fixed: 'left' as const,
      render: (v: string | null, r: Delivery) => v
        ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>
        : <Tag color="orange" style={{ margin: 0 }}>TMP#{r.id}</Tag>,
    },
    { title: '关联订单', dataIndex: 'order_id', width: 120, render: (id: number) => orderMap[id] || '-' },
    { title: '客户', dataIndex: 'customer_id', width: 110, render: (id: number) => customerMap[id] || '-' },
    { title: '送货人', dataIndex: 'delivery_person', width: 80, render: (v: string) => v || '-' },
    { title: '地址', dataIndex: 'address', width: 150, ellipsis: true },
    { title: '状态', dataIndex: 'status', width: 80, render: (s: string) => <Tag color={getStatusColor(s)}>{s}</Tag> },
    { title: '签收', dataIndex: 'signed', width: 70, render: (v: number) => v === 1 ? <Tag color="green">已签</Tag> : <Tag color="orange">未签</Tag> },
    { title: '送货日期', dataIndex: 'delivery_date', width: 100, render: (v: string) => v || '-' },
    {
      title: '操作', key: 'action', width: 220, fixed: 'right' as const,
      render: (_: any, r: Delivery) => (
        <Space size={2}>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => openDetail(r)}>明细</Button>
          {r.status === '待发货' && (
            <Popconfirm title="确认发货？" onConfirm={() => handleShip(r)}>
              <Button size="small" type="link" icon={<CarOutlined />}>发货</Button>
            </Popconfirm>
          )}
          {r.status === '已发货' && (
            <Popconfirm title="确认签收？" onConfirm={() => handleSign(r)}>
              <Button size="small" type="link" icon={<CheckCircleOutlined />}>签收</Button>
            </Popconfirm>
          )}
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r)}>
            <Button size="small" type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const itemColumns = [
    { title: '序号', width: 50, render: (_: any, __: any, idx: number) => idx + 1 },
    { title: '产品名称', dataIndex: 'product_name', width: 160 },
    {
      title: '数量', dataIndex: 'quantity', width: 90, align: 'right' as const,
      render: (v: number, r: DeliveryItemRow) => (
        <InputNumber size="small" min={1} value={v} style={{ width: 80 }}
          onChange={val => setItems(prev => prev.map(it => it.key === r.key ? { ...it, quantity: val || 1 } : it))} />
      ),
    },
    {
      title: '单价', dataIndex: 'unit_price', width: 90, align: 'right' as const,
      render: (v: number, r: DeliveryItemRow) => (
        <InputNumber size="small" min={0} step={0.01} value={v} style={{ width: 85 }}
          onChange={val => setItems(prev => prev.map(it => it.key === r.key ? { ...it, unit_price: val || 0 } : it))} />
      ),
    },
    { title: '操作', width: 60, render: (_: any, r: DeliveryItemRow) => (
      <Button size="small" type="link" danger onClick={() => handleRemoveItem(r.key)}>删除</Button>
    )},
  ];

  return (
    <div style={{ maxWidth: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, background: '#fff', padding: '10px 16px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#1e40af' }}>送货单</h2>
        <Space>
          <Input placeholder="搜索单号/送货人" value={keyword} onChange={e => setKeyword(e.target.value)}
            style={{ width: 180 }} allowClear prefix={<SearchOutlined />} size="small" />
          <Button size="small" icon={<ReloadOutlined />} onClick={fetchAll}>刷新</Button>
          <Button size="small" icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>新建发货单</Button>
        </Space>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 10, padding: '6px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, flexWrap: 'wrap', fontSize: 13 }}>
        <span>总计 <b style={{ color: '#1e40af' }}>{kpi.total}</b> 单</span>
        <span style={{ color: '#d97706' }}>待发货 <b>{kpi.pending}</b></span>
        <span style={{ color: '#0ea5e9' }}>已发货 <b>{kpi.shipped}</b></span>
        <span style={{ color: '#16a34a' }}>已签收 <b>{kpi.signed}</b></span>
      </div>

      <div style={{ marginBottom: 10, display: 'flex', gap: 8, fontSize: 12 }}>
        <Select allowClear placeholder="状态" value={filterStatus} onChange={setFilterStatus}
          style={{ width: 110 }} size="small"
          options={['待发货', '已发货', '已签收', '已取消'].map(s => ({ value: s, label: s }))} />
        <Button size="small" onClick={() => { setKeyword(''); setFilterStatus(null); }}>清除</Button>
      </div>

      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: t => `共 ${t} 条`, size: 'small' }}
        scroll={{ x: 1300 }}
        locale={{ emptyText: <TableEmptyCell resource="送货单" actionText="新建发货单" onAction={openCreate} keyword={keyword} isDataEmpty={data.length === 0} /> }} />

      {/* 新建弹窗 — EX式 */}
      <Modal title="新建发货单" open={modalOpen} onCancel={() => setModalOpen(false)} width={900} footer={null} destroyOnClose>
        <div style={{ background: '#f0f5ff', padding: 12, borderRadius: 6, marginBottom: 12 }}>
          <Form form={form} layout="inline" style={{ flexWrap: 'wrap', gap: 8 }}>
            <Form.Item name="order_id" label="关联订单" rules={[{ required: true }]}>
              <Select showSearch placeholder="选择订单（自动加载产品）" style={{ width: 280 }} optionFilterProp="label"
                onChange={handleOrderChange}
                options={orders.filter(o => o.status !== '已取消').map(o => ({
                  value: o.id,
                  label: `${o.order_no || `TMP-${o.id}`} [${customerMap[o.customer_id] || '?'}]`,
                }))} />
            </Form.Item>
            <Form.Item name="delivery_date" label="送货日期">
              <DatePicker style={{ width: 130 }} />
            </Form.Item>
            <Form.Item name="address" label="地址">
              <Input style={{ width: 200 }} placeholder="送货地址" />
            </Form.Item>
            <Form.Item name="remark" label="备注">
              <Input style={{ width: 180 }} placeholder="备注" />
            </Form.Item>
          </Form>
        </div>

        <div style={{ background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 6, padding: '8px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0050b3', whiteSpace: 'nowrap' }}>添加产品</span>
          <Select showSearch value={searchProductId} onChange={setSearchProductId}
            placeholder="搜索产品" style={{ minWidth: 220 }} optionFilterProp="label"
            options={productOptions} allowClear />
          <span style={{ fontSize: 13 }}>数量</span>
          <InputNumber min={1} value={addQty} onChange={v => setAddQty(v || 1)} style={{ width: 80 }} />
          <span style={{ fontSize: 13 }}>单价</span>
          <InputNumber min={0} step={0.01} value={addPrice} onChange={v => setAddPrice(v || 0)} style={{ width: 100 }} />
          <Button type="primary" onClick={handleAddItem} icon={<PlusOutlined />}>添加</Button>
        </div>

        <Table rowKey="key" size="small" columns={itemColumns} dataSource={items} pagination={false}
          scroll={{ y: 250 }}
          locale={{ emptyText: '选择关联订单自动加载产品，或手动搜索添加' }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}><b>合计</b></Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <b>{items.reduce((s, it) => s + it.quantity, 0)} 件</b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={2} />
            </Table.Summary.Row>
          )} />

        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => setModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSave}>创建发货单</Button>
          </Space>
        </div>
      </Modal>

      {/* 详情弹窗 */}
      <Modal title={detailData ? `发货单详情 - ${detailData.delivery_no || `#${detailData.id}`}` : '详情'}
        open={detailOpen} onCancel={() => setDetailOpen(false)} width={900} footer={null}>
        {detailData && (
          <div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 16, fontSize: 13, flexWrap: 'wrap' }}>
              <div><b>单号：</b>{detailData.delivery_no || `#${detailData.id}`}</div>
              <div><b>状态：</b><Tag color={getStatusColor(detailData.status)}>{detailData.status}</Tag></div>
              <div><b>签收：</b>{detailData.signed === 1 ? '已签收' : '未签收'}</div>
              <div><b>送货人：</b>{detailData.delivery_person || '-'}</div>
              <div><b>地址：</b>{detailData.address || '-'}</div>
              <div><b>送货日期：</b>{detailData.delivery_date || '-'}</div>
            </div>
            <Table rowKey="id" size="small" dataSource={detailData.items || []} pagination={false}
              columns={[
                { title: '序号', width: 50, render: (_: any, __: any, idx: number) => idx + 1 },
                { title: '产品ID', dataIndex: 'product_id', width: 70 },
                { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' as const },
                { title: '单价', dataIndex: 'unit_price', width: 90, align: 'right' as const, render: (v: number) => v ? `¥${v.toFixed(2)}` : '-' },
                { title: '备注', dataIndex: 'remark', ellipsis: true },
              ]} />
          </div>
        )}
      </Modal>
    </div>
  );
}
