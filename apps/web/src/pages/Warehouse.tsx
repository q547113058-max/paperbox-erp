import React, { useEffect, useState, useMemo } from 'react';
import { Table, Input, Button, Space, Tag, message, Modal, Form, Select, InputNumber, Descriptions, Popconfirm } from 'antd';
import { PlusOutlined, EyeOutlined, ReloadOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import type { WarehouseEntry, Product } from '../types/api';
import api from '../utils/axios';
import { TableEmptyCell } from '../components/TableEmptyCell';

const STATUS_COLOR: Record<string, string> = {
  '待发货': 'orange', '已发货': 'blue', '已收货': 'green', '已取消': 'red',
};

interface EntryItemRow {
  key: string;
  product_id: number | null;
  product_name: string;
  quantity: number;
  remark: string;
}

export default function Warehouse() {
  const [data, setData] = useState<WarehouseEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [items, setItems] = useState<EntryItemRow[]>([]);
  const [searchProductId, setSearchProductId] = useState<number | null>(null);
  const [addQty, setAddQty] = useState<number>(1);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<WarehouseEntry | null>(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/warehouse-entries'),
      api.get('/products').catch(() => ({ data: [] })),
    ]).then(([w, p]) => {
      setData(w.data || []);
      setProducts(p.data || []);
    }).catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const productOptions = useMemo(() =>
    products.map(p => ({
      value: p.id,
      label: `${p.name || ''} [${p.code || ''}] ${p.spec || ''}`.trim(),
    })), [products]);

  const filtered = data.filter(w =>
    !keyword || w.entry_no?.includes(keyword) || w.product_name?.includes(keyword) || String(w.order_id).includes(keyword)
  );

  const countByStatus = (status: string) => data.filter(d => d.status === status).length;

  // 明细操作
  const handleAddItem = () => {
    if (!searchProductId) { message.warning('请选择产品'); return; }
    const product = products.find(p => p.id === searchProductId);
    if (!product) { message.warning('产品不存在'); return; }
    const newItem: EntryItemRow = {
      key: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      product_id: product.id,
      product_name: product.name || '',
      quantity: addQty || 1,
      remark: '',
    };
    setItems(prev => [...prev, newItem]);
    setSearchProductId(null);
    setAddQty(1);
  };

  const handleRemoveItem = (key: string) => setItems(prev => prev.filter(it => it.key !== key));

  // 弹窗
  const openCreate = () => {
    form.resetFields();
    setItems([]);
    setSearchProductId(null);
    setAddQty(1);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (items.length === 0) { message.warning('请至少添加一个产品'); return; }

      let created = 0;
      for (const item of items) {
        await api.post('/warehouse-entries', {
          order_id: values.order_id || 0,
          work_order_id: values.work_order_id || 0,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          status: '待发货',
          remark: item.remark || values.remark || '',
        });
        created++;
      }
      message.success(`已创建 ${created} 条进仓记录`);
      setModalOpen(false);
      fetchAll();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '保存失败');
    }
  };

  const openDetail = (r: WarehouseEntry) => { setDetail(r); setDetailOpen(true); };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/warehouse-entries/${id}`); message.success('已删除'); fetchAll(); }
    catch (e: any) { message.error(e?.response?.data?.message || '删除失败'); }
  };

  const columns = [
    { title: '入库单号', dataIndex: 'entry_no', width: 120, render: (v: string) => v || '-' },
    { title: '产品名称', dataIndex: 'product_name', width: 140 },
    { title: '订单号', dataIndex: 'order_id', width: 80, render: (v: number) => v ? `#${v}` : '-' },
    { title: '工单号', dataIndex: 'work_order_id', width: 80, render: (v: number | null) => v ? `#${v}` : '-' },
    { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' as const },
    { title: '状态', dataIndex: 'status', width: 80, render: (s: string) => <Tag color={STATUS_COLOR[s] || 'default'}>{s}</Tag> },
    { title: '创建日期', dataIndex: 'created_at', width: 100, render: (v: string) => (v || '').split('T')[0] || v },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    {
      title: '操作', width: 120, fixed: 'right' as const,
      render: (_: any, r: WarehouseEntry) => (
        <Space size={2}>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const itemColumns = [
    { title: '序号', width: 50, render: (_: any, __: any, idx: number) => idx + 1 },
    { title: '产品名称', dataIndex: 'product_name', width: 180 },
    {
      title: '数量', dataIndex: 'quantity', width: 100, align: 'right' as const,
      render: (v: number, r: EntryItemRow) => (
        <InputNumber size="small" min={1} value={v} style={{ width: 80 }}
          onChange={val => setItems(prev => prev.map(it => it.key === r.key ? { ...it, quantity: val || 1 } : it))} />
      ),
    },
    { title: '操作', width: 60, render: (_: any, r: EntryItemRow) => (
      <Button size="small" type="link" danger onClick={() => handleRemoveItem(r.key)}>删除</Button>
    )},
  ];

  return (
    <div style={{ maxWidth: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, background: '#fff', padding: '10px 16px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#1e40af' }}>进仓单</h2>
        <Space>
          <Input placeholder="搜索单号/产品/订单" value={keyword} onChange={e => setKeyword(e.target.value)}
            style={{ width: 200 }} allowClear prefix={<SearchOutlined />} size="small" />
          <Button size="small" icon={<ReloadOutlined />} onClick={fetchAll}>刷新</Button>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>新增进仓</Button>
        </Space>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 10, padding: '6px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, flexWrap: 'wrap', fontSize: 13 }}>
        <span>总计 <b style={{ color: '#1e40af' }}>{data.length}</b> 条</span>
        <span style={{ color: '#fa8c16' }}>待发货 <b>{countByStatus('待发货')}</b></span>
        <span style={{ color: '#1890ff' }}>已发货 <b>{countByStatus('已发货')}</b></span>
        <span style={{ color: '#52c41a' }}>已收货 <b>{countByStatus('已收货')}</b></span>
      </div>

      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: t => `共 ${t} 条`, size: 'small' }}
        scroll={{ x: 1100 }}
        locale={{ emptyText: <TableEmptyCell resource="进仓单" actionText="新增进仓" onAction={openCreate} keyword={keyword} isDataEmpty={data.length === 0} /> }} />

      {/* 新增弹窗 — EX式单行添加 */}
      <Modal title="新增进仓单" open={modalOpen} onCancel={() => setModalOpen(false)} width={800} footer={null} destroyOnClose>
        <div style={{ background: '#f0f5ff', padding: 12, borderRadius: 6, marginBottom: 12 }}>
          <Form form={form} layout="inline" style={{ flexWrap: 'wrap', gap: 8 }}>
            <Form.Item name="order_id" label="关联订单">
              <InputNumber min={0} style={{ width: 100 }} placeholder="订单ID" />
            </Form.Item>
            <Form.Item name="work_order_id" label="关联工单">
              <InputNumber min={0} style={{ width: 100 }} placeholder="工单ID" />
            </Form.Item>
            <Form.Item name="remark" label="备注">
              <Input style={{ width: 200 }} placeholder="备注" />
            </Form.Item>
          </Form>
        </div>

        <div style={{ background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 6, padding: '8px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0050b3', whiteSpace: 'nowrap' }}>添加产品</span>
          <Select showSearch value={searchProductId} onChange={setSearchProductId}
            placeholder="搜索产品" style={{ minWidth: 250 }} optionFilterProp="label"
            options={productOptions} allowClear />
          <span style={{ fontSize: 13 }}>数量</span>
          <InputNumber min={1} value={addQty} onChange={v => setAddQty(v || 1)} style={{ width: 80 }} />
          <Button type="primary" onClick={handleAddItem} icon={<PlusOutlined />}>添加</Button>
        </div>

        <Table rowKey="key" size="small" columns={itemColumns} dataSource={items} pagination={false}
          scroll={{ y: 250 }}
          locale={{ emptyText: '暂无产品，请在上方搜索产品后添加' }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}><b>合计</b></Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <b>{items.reduce((s, it) => s + it.quantity, 0)} 件</b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} />
            </Table.Summary.Row>
          )} />

        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => setModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSave}>创建进仓单</Button>
          </Space>
        </div>
      </Modal>

      {/* 详情弹窗 */}
      <Modal title={detail ? `进仓详情 - ${detail.entry_no || `#${detail.id}`}` : '进仓详情'}
        open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={640} destroyOnClose>
        {detail && (
          <Descriptions size="small" column={2} bordered>
            <Descriptions.Item label="入库单号">{detail.entry_no || '-'}</Descriptions.Item>
            <Descriptions.Item label="产品名称">{detail.product_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="订单号">#{detail.order_id}</Descriptions.Item>
            <Descriptions.Item label="工单号">{detail.work_order_id ? `#${detail.work_order_id}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="数量">{detail.quantity ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={STATUS_COLOR[detail.status] || 'default'}>{detail.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="创建日期" span={2}>{detail.created_at?.split('T')[0] || detail.created_at || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{detail.remark || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
