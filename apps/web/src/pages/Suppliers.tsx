import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Tag, Popconfirm, message, Modal, Form, InputNumber, Select } from 'antd';
import type { Supplier } from '../types/api';
import api from '../utils/axios';

const STATUS_OPTIONS = ['合作中', '暂停', '终止'];
const PAYMENT_CYCLE_OPTIONS = ['月结', '现结', '季结', '预付'];
const SUPPLIER_TYPE_OPTIONS = ['原材料', '辅料', '加工', '设备', '其他'];

export default function Suppliers() {
  const [data, setData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    api.get('/suppliers').then((r) => setData(r.data)).catch(() => message.error('加载失败')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = data.filter((s) =>
    !keyword || s.name?.includes(keyword) || s.contact?.includes(keyword) || s.phone?.includes(keyword)
  );

  const handleCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const handleEdit = (s: Supplier) => { setEditing(s); form.setFieldsValue(s); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editing) { await api.put(`/suppliers/${editing.id}`, values); message.success('更新成功'); }
      else { await api.post('/suppliers', values); message.success('创建成功'); }
      setModalOpen(false);
      fetchData();
    } catch (e: any) { if (!e.response) message.error('保存失败'); }
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/suppliers/${id}`); message.success('已删除'); fetchData(); } catch { message.error('删除失败'); }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name', render: (v: string) => v || '-' },
    { title: '联系人', dataIndex: 'contact', key: 'contact' },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '类型', dataIndex: 'supplier_type', key: 'supplier_type', width: 90 },
    { title: '主营', dataIndex: 'material_type', key: 'material_type', width: 100 },
    { title: '账期', dataIndex: 'payment_cycle', key: 'payment_cycle', width: 80 },
    { title: '账期天数', dataIndex: 'payment_days', key: 'payment_days', width: 80 },
    { title: '额度', dataIndex: 'credit_limit', key: 'credit_limit', width: 90, render: (v: number) => v ? `¥${v.toLocaleString()}` : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v: string) => <Tag color={v === '合作中' ? 'green' : 'default'}>{v}</Tag> },
    {
      title: '操作', key: 'action', width: 120,
      render: (_: any, r: Supplier) => (
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
        <h2 style={{ margin: 0 }}>供应商管理</h2>
        <Space>
          <Input placeholder="搜索名称/联系人/电话" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 220 }} allowClear />
          <Button type="primary" onClick={handleCreate}>新增供应商</Button>
        </Space>
      </div>

      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 15 }} />

      <Modal title={editing ? '编辑供应商' : '新增供应商'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} okText="保存" cancelText="取消">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space wrap>
            <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input style={{ width: 180 }} /></Form.Item>
            <Form.Item name="contact" label="联系人"><Input style={{ width: 140 }} /></Form.Item>
            <Form.Item name="phone" label="电话"><Input style={{ width: 140 }} /></Form.Item>
          </Space>
          <Space wrap>
            <Form.Item name="supplier_type" label="供应商类型"><Select options={SUPPLIER_TYPE_OPTIONS.map((s) => ({ value: s, label: s }))} style={{ width: 130 }} /></Form.Item>
            <Form.Item name="material_type" label="主营材料"><Input style={{ width: 140 }} /></Form.Item>
            <Form.Item name="payment_cycle" label="账期"><Select options={PAYMENT_CYCLE_OPTIONS.map((s) => ({ value: s, label: s }))} style={{ width: 120 }} /></Form.Item>
            <Form.Item name="payment_days" label="账期天数"><InputNumber min={0} style={{ width: 80 }} /></Form.Item>
            <Form.Item name="credit_limit" label="信用额度"><InputNumber min={0} style={{ width: 120 }} /></Form.Item>
          </Space>
          <Form.Item name="address" label="地址"><Input.TextArea rows={1} style={{ width: 480 }} /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} style={{ width: 480 }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
