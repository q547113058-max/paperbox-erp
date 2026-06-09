import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Tag, Popconfirm, message, Modal, Form, InputNumber, Select } from 'antd';
import type { Customer } from '../types/api';
import api from '../utils/axios';

const STATUS_OPTIONS = ['活跃', '暂停', '流失'];
const PAYMENT_CYCLE_OPTIONS = ['月结', '现结', '季结', '预付'];

export default function Customers() {
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    api.get('/customers').then((r) => setData(r.data)).catch(() => message.error('加载失败')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = data.filter((c) =>
    !keyword || c.name?.includes(keyword) || c.contact?.includes(keyword) || c.phone?.includes(keyword)
  );

  const handleCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const handleEdit = (c: Customer) => { setEditing(c); form.setFieldsValue(c); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editing) { await api.put(`/customers/${editing.id}`, values); message.success('更新成功'); }
      else { await api.post('/customers', values); message.success('创建成功'); }
      setModalOpen(false);
      fetchData();
    } catch (e: any) { if (!e.response) message.error('保存失败'); }
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/customers/${id}`); message.success('已删除'); fetchData(); } catch { message.error('删除失败'); }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name', render: (v: string) => v || '-' },
    { title: '联系人', dataIndex: 'contact', key: 'contact' },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '地址', dataIndex: 'address', key: 'address', ellipsis: true },
    { title: '业务员', dataIndex: 'salesman', key: 'salesman', width: 90 },
    { title: '账期', dataIndex: 'payment_cycle', key: 'payment_cycle', width: 80 },
    { title: '回款率', dataIndex: 'rebate_percent', key: 'rebate_percent', width: 80, render: (v: number) => v ? `${v}%` : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v: string) => <Tag color={v === '活跃' ? 'green' : 'default'}>{v}</Tag> },
    {
      title: '操作', key: 'action', width: 120,
      render: (_: any, r: Customer) => (
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
        <h2 style={{ margin: 0 }}>客户管理</h2>
        <Space>
          <Input placeholder="搜索名称/联系人/电话" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 220 }} allowClear />
          <Button type="primary" onClick={handleCreate}>新增客户</Button>
        </Space>
      </div>

      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 15 }} />

      <Modal title={editing ? '编辑客户' : '新增客户'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} okText="保存" cancelText="取消">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space wrap>
            <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input style={{ width: 180 }} /></Form.Item>
            <Form.Item name="contact" label="联系人"><Input style={{ width: 140 }} /></Form.Item>
            <Form.Item name="phone" label="电话"><Input style={{ width: 140 }} /></Form.Item>
          </Space>
          <Form.Item name="address" label="地址"><Input.TextArea rows={1} style={{ width: 480 }} /></Form.Item>
          <Space wrap>
            <Form.Item name="salesman" label="业务员"><Input style={{ width: 120 }} /></Form.Item>
            <Form.Item name="payment_cycle" label="账期"><Select options={PAYMENT_CYCLE_OPTIONS.map((s) => ({ value: s, label: s }))} style={{ width: 120 }} /></Form.Item>
            <Form.Item name="tax_included" label="含税" valuePropName="checked" initialValue={1}><input type="checkbox" /></Form.Item>
            <Form.Item name="rebate_percent" label="回款率%"><InputNumber min={0} max={100} style={{ width: 80 }} /></Form.Item>
          </Space>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} style={{ width: 480 }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
