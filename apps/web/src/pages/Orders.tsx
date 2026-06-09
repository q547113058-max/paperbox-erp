import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Tag, Popconfirm, message, Modal, Form, InputNumber, Select, DatePicker } from 'antd';
import type { Order, Customer } from '../types/api';
import api from '../utils/axios';
import dayjs from 'dayjs';

const STATUS_OPTIONS = ['待确认', '已确认', '生产中', '待发货', '已完成', '已取消'];
const STATUS_COLOR: Record<string, string> = {
  '待确认': 'default', '已确认': 'blue', '生产中': 'orange',
  '待发货': 'purple', '已完成': 'green', '已取消': 'red',
};

export default function Orders() {
  const [data, setData] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [form] = Form.useForm();

  const fetchAll = () => {
    setLoading(true);
    Promise.all([api.get('/orders'), api.get('/customers')])
      .then(([o, c]) => { setData(o.data); setCustomers(c.data); })
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c.name || c.contact]));

  const filtered = data.filter((o) =>
    !keyword || o.order_no?.includes(keyword) || String(o.customer_id).includes(keyword)
  );

  const handleCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const handleEdit = (o: Order) => { setEditing(o); form.setFieldsValue({ ...o, delivery_date: o.delivery_date ? dayjs(o.delivery_date) : null, order_date: o.order_date ? dayjs(o.order_date) : null }); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, delivery_date: values.delivery_date?.format('YYYY-MM-DD'), order_date: values.order_date?.format('YYYY-MM-DD') };
      if (editing) { await api.put(`/orders/${editing.id}`, payload); message.success('更新成功'); }
      else { await api.post('/orders', payload); message.success('创建成功'); }
      setModalOpen(false);
      fetchAll();
    } catch (e: any) { if (!e.response) message.error('保存失败'); }
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/orders/${id}`); message.success('已删除'); fetchAll(); } catch { message.error('删除失败'); }
  };

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 130, render: (v: string) => v || '-' },
    { title: '客户', dataIndex: 'customer_id', key: 'customer', width: 120, render: (id: number) => customerMap[id] || `ID:${id}` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (s: string) => <Tag color={STATUS_COLOR[s] || 'default'}>{s}</Tag> },
    { title: '总金额', dataIndex: 'total_amount', key: 'total_amount', width: 110, render: (v: number) => `¥${Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` },
    { title: '成本', dataIndex: 'total_cost', key: 'total_cost', width: 100, render: (v: number) => `¥${Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` },
    { title: '利润', dataIndex: 'profit', key: 'profit', width: 100, render: (v: number) => `¥${Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` },
    { title: '客户单号', dataIndex: 'customer_order_no', key: 'customer_order_no', width: 110, render: (v: string) => v || '-' },
    { title: '交货日期', dataIndex: 'delivery_date', key: 'delivery_date', width: 110 },
    { title: '订单日期', dataIndex: 'order_date', key: 'order_date', width: 110 },
    { title: '创建日期', dataIndex: 'created_at', key: 'created_at', width: 110, render: (v: string) => v?.split('T')[0] || v },
    {
      title: '操作', key: 'action', width: 120,
      render: (_: any, r: Order) => (
        <Space>
          <Button size="small" type="link" onClick={() => handleEdit(r)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>订单管理</h2>
        <Space>
          <Input placeholder="搜索订单号/客户" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 200 }} allowClear />
          <Button type="primary" onClick={handleCreate}>新建订单</Button>
        </Space>
      </div>

      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 15 }} />

      <Modal title={editing ? '编辑订单' : '新建订单'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} width={700} okText="保存" cancelText="取消">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space wrap>
            <Form.Item name="order_no" label="订单号"><Input style={{ width: 160 }} /></Form.Item>
            <Form.Item name="customer_id" label="客户ID" rules={[{ required: true }]}><InputNumber style={{ width: 120 }} /></Form.Item>
            <Form.Item name="status" label="状态" initialValue="待确认">
              <Select options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} style={{ width: 120 }} />
            </Form.Item>
          </Space>
          <Space wrap>
            <Form.Item name="order_date" label="订单日期"><DatePicker /></Form.Item>
            <Form.Item name="delivery_date" label="交货日期"><DatePicker /></Form.Item>
            <Form.Item name="customer_order_no" label="客户单号"><Input style={{ width: 160 }} /></Form.Item>
          </Space>
          <Space wrap>
            <Form.Item name="total_amount" label="总金额"><InputNumber min={0} step={0.01} style={{ width: 120 }} /></Form.Item>
            <Form.Item name="total_cost" label="总成本"><InputNumber min={0} step={0.01} style={{ width: 120 }} /></Form.Item>
            <Form.Item name="profit" label="利润"><InputNumber step={0.01} style={{ width: 120 }} /></Form.Item>
          </Space>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} style={{ width: 400 }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
