import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Tag, Popconfirm, message, Modal, Form, InputNumber, Select, Image } from 'antd';
import type { Product } from '../types/api';
import api from '../utils/axios';
import { ImageUpload } from '../components/ImageUpload';
import { ExcelActions } from '../components/ExcelActions';

const UNIT_OPTIONS = ['个', '套', '箱', '平方米', '米'];
const STATUS_OPTIONS = ['正常生产', '已停产', '开发中', '打样'];

export default function Products() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    api.get('/products').then((r) => setData(r.data)).catch(() => message.error('加载失败')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = data.filter((p) =>
    !keyword || p.code?.includes(keyword) || p.name?.includes(keyword) || p.spec?.includes(keyword)
  );

  const handleCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const handleEdit = (p: Product) => { setEditing(p); form.setFieldsValue(p); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await api.put(`/products/${editing.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/products', values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch (e: any) {
      if (!e.response) message.error('保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/products/${id}`); message.success('已删除'); fetchData(); } catch { message.error('删除失败'); }
  };

  const columns = [
    { 
      title: '图片', 
      dataIndex: 'finished_product_image', 
      key: 'image', 
      width: 80,
      render: (v: string) => v ? <Image src={v} width={50} height={50} style={{ objectFit: 'cover' }} /> : '-'
    },
    { title: '产品编号', dataIndex: 'code', key: 'code', width: 120 },
    { title: '名称', dataIndex: 'name', key: 'name', render: (v: string) => v || '-' },
    { title: '规格', dataIndex: 'spec', key: 'spec', width: 80 },
    { title: '长×宽×高', key: 'size', width: 140, render: (_: any, r: Product) => `${r.length}×${r.width}×${r.height}` },
    { title: '材质', dataIndex: 'material', key: 'material', width: 100 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 70 },
    { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 90, render: (v: number) => `¥${v}` },
    { title: '库存', dataIndex: 'stock_qty', key: 'stock_qty', width: 80 },
    { title: '安全库存', dataIndex: 'safety_stock', key: 'safety_stock', width: 90 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (v: string) => <Tag>{v || '正常生产'}</Tag> },
    {
      title: '操作', key: 'action', width: 120,
      render: (_: any, r: Product) => (
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
        <h2 style={{ margin: 0 }}>产品管理</h2>
        <Space>
          <Input placeholder="搜索编号/名称/规格" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 220 }} allowClear />
          <ExcelActions entity="products" onImport={() => fetchData()} />
          <Button type="primary" onClick={handleCreate}>新增产品</Button>
        </Space>
      </div>

      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 20 }} />

      <Modal
        title={editing ? '编辑产品' : '新增产品'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space wrap style={{ width: '100%' }}>
            <Form.Item name="code" label="产品编号" rules={[{ required: true }]}><Input style={{ width: 160 }} /></Form.Item>
            <Form.Item name="name" label="名称"><Input style={{ width: 200 }} /></Form.Item>
            <Form.Item name="spec" label="规格" rules={[{ required: true }]}><Input style={{ width: 120 }} /></Form.Item>
          </Space>
          <Space wrap>
            <Form.Item name="length" label="长"><InputNumber min={0} style={{ width: 100 }} /></Form.Item>
            <Form.Item name="width" label="宽"><InputNumber min={0} style={{ width: 100 }} /></Form.Item>
            <Form.Item name="height" label="高"><InputNumber min={0} style={{ width: 100 }} /></Form.Item>
            <Form.Item name="material" label="材质"><Input style={{ width: 120 }} /></Form.Item>
            <Form.Item name="unit" label="单位"><Select options={UNIT_OPTIONS.map((u) => ({ value: u, label: u }))} style={{ width: 100 }} /></Form.Item>
          </Space>
          <Space wrap>
            <Form.Item name="unit_price" label="单价"><InputNumber min={0} step={0.01} style={{ width: 120 }} /></Form.Item>
            <Form.Item name="cost" label="成本"><InputNumber min={0} step={0.01} style={{ width: 120 }} /></Form.Item>
            <Form.Item name="stock_qty" label="库存"><InputNumber min={0} style={{ width: 120 }} /></Form.Item>
            <Form.Item name="safety_stock" label="安全库存"><InputNumber min={0} style={{ width: 120 }} /></Form.Item>
          </Space>
          <Form.Item name="status" label="状态" initialValue="正常生产">
            <Select options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="finished_product_image" label="产品图片">
            <ImageUpload />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
