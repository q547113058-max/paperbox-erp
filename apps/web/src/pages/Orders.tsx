import React, { useEffect, useState, useMemo } from 'react';
import {
  Table, Input, Button, Space, Tag, message, Modal, Form,
  Select, DatePicker, InputNumber,
} from 'antd';
import {
  PlusOutlined, EyeOutlined,
  SaveOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { Order, Product, Customer } from '../types/api';
import api from '../utils/axios';
import dayjs from 'dayjs';
import { getStatusColor } from '../utils/statusColor';
import { InlineItemEditor } from '../components/InlineItemEditor';

const STATUS_OPTIONS = ['待确认', '已确认', '生产中', '待发货', '已完成', '已取消'];

// ---- 明细条目类型（按用户要求的新列序） ----
interface OrderItemRow {
  key: string;
  product_id: number | null;
  customer_code: string;
  material_code: string;
  material_name: string;
  material_spec: string;
  unit: string;
  quantity: number;
  unit_price: number;
  amount: number;
  order_date: string;
  delivery_date: string;
  remark: string;
}

export default function Orders() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ---- 头部表单 ----
  const [headerForm] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);

  // ---- 明细状态 ----
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [searchProductId, setSearchProductId] = useState<number | null>(null);
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [addUnitPrice, setAddUnitPrice] = useState<number>(0);

  // ---- 确认弹窗 ----
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ---- 详情弹窗 ----
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailItems, setDetailItems] = useState<any[]>([]);

  // ====== 数据加载 ======
  const loadRefData = () => {
    setLoading(true);
    Promise.all([
      api.get('/products').catch(() => ({ data: [] })),
      api.get('/customers').catch(() => ({ data: [] })),
    ]).then(([p, c]) => {
      setProducts(p.data || []);
      setCustomers(c.data || []);
    }).catch(() => message.error('加载数据失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRefData(); }, []);

  // ====== 产品搜索选项（增强显示：编码 | 名称 | 规格 | 单位） ======
  const productOptions = useMemo(() =>
    products.map(p => ({
      value: p.id,
      label: `${p.code || ''} | ${p.name || ''} | ${p.spec || ''} | ${p.unit || ''}`.replace(/^\s*\|\s*/, '').trim(),
    })), [products]);

  // ====== 明细操作 ======
  const handleAddItem = () => {
    const pid = searchProductId;
    if (!pid) { message.warning('请搜索选择物料'); return; }
    const product = products.find(p => p.id === pid);
    if (!product) { message.warning('物料不存在'); return; }

    const qty = addQuantity || 1;
    const up = addUnitPrice || 0;

    const newItem: OrderItemRow = {
      key: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      product_id: product.id,
      customer_code: (product as any).customer_code || '',
      material_code: product.code || '',
      material_name: product.name || '',
      material_spec: product.spec || '',
      unit: product.unit || '',
      quantity: qty,
      unit_price: up,
      amount: qty * up,
      order_date: dayjs().format('YYYY-MM-DD'),
      delivery_date: '',
      remark: '',
    };
    setItems(prev => [...prev, newItem]);
    setSearchProductId(null);
    setAddQuantity(1);
    setAddUnitPrice(0);
  };

  const handleRemoveItem = (key: string) => {
    setItems(prev => prev.filter(it => it.key !== key));
  };

  const totalAmount = useMemo(() =>
    items.reduce((s, it) => s + (it.amount || it.quantity * (it.unit_price || 0)), 0),
  [items]);

  // ====== 重置表单 ======
  const resetForm = () => {
    setEditingId(null);
    headerForm.resetFields();
    headerForm.setFieldsValue({ order_date: dayjs() });
    setItems([]);
    setSearchProductId(null);
    setAddQuantity(1);
    setAddUnitPrice(0);
  };

  // ====== 编辑订单（加载到表单） ======
  const openEdit = async (order: Order) => {
    setEditingId(order.id);
    try {
      const res = await api.get(`/orders/${order.id}`);
      const full = res.data;
      headerForm.setFieldsValue({
        customer_id: full.customer_id || undefined,
        order_date: full.order_date ? dayjs(full.order_date) : null,
        customer_order_no: full.customer_order_no || '',
        remark: full.remark || '',
      });
      const existingItems: OrderItemRow[] = (full.items || []).map((it: any, idx: number) => ({
        key: `edit_${it.id || idx}`,
        product_id: it.product_id,
        customer_code: (products.find(p => p.id === it.product_id) as any)?.customer_code || '',
        material_code: products.find(p => p.id === it.product_id)?.code || '',
        material_name: products.find(p => p.id === it.product_id)?.name || '',
        material_spec: products.find(p => p.id === it.product_id)?.spec || '',
        unit: products.find(p => p.id === it.product_id)?.unit || '',
        quantity: it.quantity || 0,
        unit_price: it.unit_price || 0,
        amount: it.amount || 0,
        order_date: it.order_date || full.order_date || '',
        delivery_date: it.delivery_date || '',
        remark: it.remark || '',
      }));
      setItems(existingItems);
      // 滚动到表单顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      message.error('加载订单详情失败');
    }
  };

  // ====== 确认保存弹窗 ======
  const handleOpenConfirm = async () => {
    try {
      await headerForm.validateFields();
      if (items.length === 0) {
        message.warning('请至少添加一条物料明细');
        return;
      }
      setConfirmOpen(true);
    } catch {
      // 表单验证失败
    }
  };

  const handleSave = async () => {
    setConfirmOpen(false);
    setSaving(true);
    try {
      const values = headerForm.getFieldsValue();
      const payload = {
        order: {
          customer_id: values.customer_id,
          order_date: values.order_date?.format?.('YYYY-MM-DD') || values.order_date,
          customer_order_no: values.customer_order_no || '',
          remark: values.remark || '',
          status: '待确认',
          total_amount: totalAmount,
          total_cost: 0,
          profit: 0,
        },
        items: items.map(it => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
          amount: it.amount || it.quantity * it.unit_price,
          order_date: it.order_date || '',
          delivery_date: it.delivery_date || '',
          customer_product_code: it.customer_code || '',
          remark: it.remark || '',
        })),
      };

      if (editingId) {
        await api.put(`/orders/${editingId}`, payload);
        message.success('订单已更新');
      } else {
        await api.post('/orders', payload);
        message.success('订单已创建');
      }
      resetForm();
    } catch (e: any) {
      if (!e.errorFields) message.error(e?.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // ====== 查看详情 ======
  const openDetail = async (order: Order) => {
    try {
      const res = await api.get(`/orders/${order.id}`);
      setDetailData(res.data);
      setDetailItems(res.data.items || []);
      setDetailOpen(true);
    } catch {
      message.error('加载详情失败');
    }
  };

  // ====== 删除 ======
  const handleDelete = async (id: number) => {
    try { await api.delete(`/orders/${id}`); message.success('已删除'); }
    catch (e: any) { message.error(e?.response?.data?.message || '删除失败'); }
  };

  // ====== 状态推进 ======
  const handleStatusChange = async (order: Order, status: string) => {
    try { await api.put(`/orders/${order.id}/status`, { status }); message.success('状态已更新'); }
    catch (e: any) { message.error(e?.response?.data?.message || '更新失败'); }
  };

  // ====== 生成工单/发货单 ======
  const handleGenerateWorkOrder = async (order: Order) => {
    try {
      await api.post('/work_orders/from-order', { order_id: order.id });
      message.success('工单已生成');
    } catch (e: any) { message.error(e?.response?.data?.message || '生成失败'); }
  };

  const handleGenerateDelivery = async (order: Order) => {
    try {
      const full = await api.get(`/orders/${order.id}`);
      const orderItems = full.data?.items || [];
      if (!orderItems.length) { message.warning('该订单无产品明细'); return; }
      await api.post('/deliveries/from-order', {
        order_id: order.id,
        items: orderItems.map((it: any) => ({ product_id: it.product_id, quantity: it.quantity })),
      });
      message.success('发货单已生成');
    } catch (e: any) { message.error(e?.response?.data?.message || '生成失败'); }
  };

  // ====== 明细表列（按用户要求的新列序） ======
  const itemColumns = [
    { key: 'idx', title: '序号', width: 50, render: (_: any, __: any, idx: number) => idx + 1 },
    {
      key: 'customer_code', title: '客户编码', dataIndex: 'customer_code', width: 100,
      render: (v: string, r: OrderItemRow) => (
        <Input size="small" value={v} style={{ width: 95 }}
          onChange={e => setItems(prev => prev.map(it => it.key === r.key ? { ...it, customer_code: e.target.value } : it))} />
      ),
    },
    {
      key: 'material_code', title: '物料编码', dataIndex: 'material_code', width: 100,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v || '-'}</span>,
    },
    { key: 'material_name', title: '物料名称', dataIndex: 'material_name', width: 120 },
    { key: 'material_spec', title: '物料规格', dataIndex: 'material_spec', width: 100 },
    { key: 'unit', title: '单位', dataIndex: 'unit', width: 60 },
    {
      key: 'quantity', title: '数量', dataIndex: 'quantity', width: 80, align: 'right' as const,
      render: (v: number, r: OrderItemRow) => (
        <InputNumber size="small" min={0} value={v} style={{ width: 70 }}
          onChange={val => {
            const q = val || 0;
            setItems(prev => prev.map(it => it.key === r.key ? { ...it, quantity: q, amount: q * (it.unit_price || 0) } : it));
          }} />
      ),
    },
    {
      key: 'unit_price', title: '单价', dataIndex: 'unit_price', width: 90, align: 'right' as const,
      render: (v: number, r: OrderItemRow) => (
        <InputNumber size="small" min={0} step={0.01} value={v} style={{ width: 85 }}
          onChange={val => {
            const up = val || 0;
            setItems(prev => prev.map(it => it.key === r.key ? { ...it, unit_price: up, amount: it.quantity * up } : it));
          }} />
      ),
    },
    {
      key: 'amount', title: '总价', dataIndex: 'amount', width: 100, align: 'right' as const,
      render: (_: number, r: OrderItemRow) => {
        const amt = r.amount || r.quantity * (r.unit_price || 0);
        return <span style={{ fontWeight: 600, color: '#dc2626' }}>¥{amt.toFixed(2)}</span>;
      },
    },
    {
      key: 'order_date', title: '下单日期', dataIndex: 'order_date', width: 115,
      render: (v: string, r: OrderItemRow) => (
        <DatePicker size="small" value={v ? dayjs(v) : null} style={{ width: 108 }}
          onChange={d => setItems(prev => prev.map(it => it.key === r.key ? { ...it, order_date: d?.format('YYYY-MM-DD') || '' } : it))} />
      ),
    },
    {
      key: 'delivery_date', title: '交期', dataIndex: 'delivery_date', width: 115,
      render: (v: string, r: OrderItemRow) => (
        <DatePicker size="small" value={v ? dayjs(v) : null} style={{ width: 108 }}
          onChange={d => setItems(prev => prev.map(it => it.key === r.key ? { ...it, delivery_date: d?.format('YYYY-MM-DD') || '' } : it))} />
      ),
    },
    {
      key: 'remark', title: '备注', dataIndex: 'remark', width: 130,
      render: (v: string, r: OrderItemRow) => (
        <Input size="small" value={v} style={{ width: 120 }}
          onChange={e => setItems(prev => prev.map(it => it.key === r.key ? { ...it, remark: e.target.value } : it))} />
      ),
    },
    {
      key: 'action', title: '操作', width: 60, fixed: 'right' as const,
      render: (_: any, r: OrderItemRow) => (
        <Button size="small" type="link" danger onClick={() => handleRemoveItem(r.key)}>删除</Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '100%' }}>
      {/* ====== 页面标题 ====== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: '#1e40af' }}>
          {editingId ? `编辑销售订单 #${editingId}` : '新增销售订单'}
        </h2>
        {editingId && (
          <Button onClick={resetForm} icon={<PlusOutlined />}>新建订单</Button>
        )}
      </div>

      {/* ====== 单据头表单 ====== */}
      <div style={{ background: '#f0f5ff', padding: '12px 16px', borderRadius: 8, marginBottom: 16, border: '1px solid #dbeafe' }}>
        <Form form={headerForm} layout="inline" style={{ flexWrap: 'wrap', gap: 10 }}>
          <Form.Item name="customer_id" label="客户名称" rules={[{ required: true, message: '请选择客户' }]}>
            <Select
              showSearch
              placeholder="搜索选择客户"
              style={{ width: 180 }}
              optionFilterProp="label"
              options={customers.map(c => ({ value: c.id, label: c.name || c.contact || `ID:${c.id}` }))}
              allowClear
            />
          </Form.Item>
          <Form.Item name="customer_order_no" label="客户单号">
            <Input style={{ width: 150 }} placeholder="客户订单号" />
          </Form.Item>
          <Form.Item name="order_date" label="下单日期" initialValue={dayjs()}>
            <DatePicker style={{ width: 130 }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input style={{ width: 220 }} placeholder="备注" />
          </Form.Item>
          <Form.Item>
            <Button onClick={resetForm} size="small">清空</Button>
          </Form.Item>
        </Form>
      </div>

      {/* ====== 物料明细编辑 ====== */}
      <InlineItemEditor
        toolbarTitle="添加物料明细"
        searchValue={searchProductId}
        onSearchChange={setSearchProductId}
        searchOptions={productOptions}
        searchPlaceholder="搜索物料编码/名称/规格（自动弹出可选物料）"
        quantityLabel="数量"
        quantityValue={addQuantity}
        onQuantityChange={v => setAddQuantity(v || 1)}
        priceLabel="单价"
        priceValue={addUnitPrice}
        onPriceChange={v => setAddUnitPrice(v || 0)}
        addButtonText="添加"
        onAddItem={handleAddItem}
        items={items}
        columns={itemColumns}
        emptyText="暂无明细。请在上方搜索物料后添加（输入物料编码/名称可自动弹出已录入物料供选择）"
        renderSummary={(its) => its.length > 0 ? (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={6}>
              <b style={{ fontSize: 14 }}>合计</b>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={6} align="right">
              <b>{its.reduce((s, it) => s + it.quantity, 0)}</b>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={7} colSpan={2}>
              <b style={{ fontSize: 15, color: '#dc2626' }}>
                ¥{totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </b>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={9} colSpan={4} />
          </Table.Summary.Row>
        ) : null}
      />

      {/* ====== 底部操作按钮 ====== */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={resetForm}>清空表单</Button>
        <Button
          type="primary"
          size="large"
          icon={<SaveOutlined />}
          onClick={handleOpenConfirm}
          loading={saving}
          disabled={items.length === 0}
        >
          {editingId ? '更新订单' : '保存订单'}
        </Button>
      </div>

      {/* ====== 确认保存弹窗 ====== */}
      <Modal
        title={<span><ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />确认保存</span>}
        open={confirmOpen}
        onOk={handleSave}
        onCancel={() => setConfirmOpen(false)}
        okText="确认保存"
        cancelText="取消"
        width={450}
      >
        <div style={{ fontSize: 14, lineHeight: 2 }}>
          <p><b>客户：</b>{customers.find(c => c.id === headerForm.getFieldValue('customer_id'))?.name || '-'}</p>
          <p><b>客户单号：</b>{headerForm.getFieldValue('customer_order_no') || '-'}</p>
          <p><b>明细行数：</b>{items.length} 行</p>
          <p><b>总数量：</b>{items.reduce((s, it) => s + it.quantity, 0)}</p>
          <p><b>总金额：</b><span style={{ color: '#dc2626', fontWeight: 600, fontSize: 16 }}>¥{totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span></p>
          <p style={{ color: '#8c8c8c', fontSize: 12 }}>订单号将在保存后自动生成</p>
        </div>
      </Modal>

      {/* ====== 详情弹窗 ====== */}
      <Modal
        title={detailData ? `订单详情 - ${detailData.order_no || `#${detailData.id}`}` : '订单详情'}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        width={1000}
        footer={null}
      >
        {detailData && (
          <div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 16, fontSize: 13, flexWrap: 'wrap' }}>
              <div><b>订单号：</b>{detailData.order_no || `TMP-${detailData.id}`}</div>
              <div><b>状态：</b><Tag color={getStatusColor(detailData.status)}>{detailData.status}</Tag></div>
              <div><b>金额：</b><span style={{ color: '#dc2626', fontWeight: 600 }}>¥{Number(detailData.total_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span></div>
              <div><b>下单日期：</b>{detailData.order_date || '-'}</div>
              <div><b>交货日期：</b>{detailData.delivery_date || '-'}</div>
              <div><b>备注：</b>{detailData.remark || '-'}</div>
            </div>
            <Table rowKey="id" size="small" dataSource={detailItems} pagination={false}
              columns={[
                { title: '序号', width: 50, render: (_: any, __: any, idx: number) => idx + 1 },
                { title: '产品ID', dataIndex: 'product_id', width: 70 },
                { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' as const },
                { title: '单价', dataIndex: 'unit_price', width: 90, align: 'right' as const, render: (v: number) => v ? `¥${v.toFixed(2)}` : '-' },
                { title: '金额', dataIndex: 'amount', width: 100, align: 'right' as const, render: (v: number) => v ? `¥${v.toFixed(2)}` : '-' },
                { title: '已发货', dataIndex: 'delivered_qty', width: 80, align: 'right' as const },
                { title: '下单日期', dataIndex: 'order_date', width: 100, render: (v: string) => v || '-' },
                { title: '交期', dataIndex: 'delivery_date', width: 90, render: (v: string) => v || '-' },
                { title: '客户编码', dataIndex: 'customer_product_code', width: 90, render: (v: string) => v || '-' },
                { title: '备注', dataIndex: 'remark', ellipsis: true },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
