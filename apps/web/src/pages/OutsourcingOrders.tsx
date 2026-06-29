import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Tag, message, Modal, Form, InputNumber, Select, Descriptions } from 'antd';
import { PlusOutlined, EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { OutsourcingOrder, Supplier } from '../types/api';
import api from '../utils/axios';
import { TableEmptyCell } from '../components/TableEmptyCell';
import { getStatusColor } from '../utils/statusColor';

export default function OutsourcingOrders() {
  const [data, setData] = useState<OutsourcingOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<OutsourcingOrder | null>(null);
  const [customerMap, setCustomerMap] = useState<Record<number, string>>({});

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/outsourcing_orders'),
      api.get('/suppliers').catch(() => ({ data: [] })),
      api.get('/customers').catch(() => ({ data: [] })),
    ]).then(([o, s, c]) => {
      setData(o.data || []);
      setSuppliers(s.data || []);
      const cm: Record<number, string> = {};
      (c.data || []).forEach((cu: any) => { cm[cu.id] = cu.name || `ID:${cu.id}`; });
      setCustomerMap(cm);
    }).catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = data.filter(o =>
    !keyword || o.order_no?.includes(keyword) || o.material_name?.includes(keyword)
  );

  const handleCreate = () => { form.resetFields(); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      await api.post('/outsourcing_orders', v);
      message.success('创建成功');
      setModalOpen(false);
      fetchAll();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message || '保存失败');
    }
  };

  const handleComplete = async (o: OutsourcingOrder) => {
    let recvQty: number | null = null;
    Modal.confirm({
      title: `委外完工 - ${o.order_no}`,
      content: <InputNumber min={0} defaultValue={o.quantity} onChange={v => { recvQty = v; }} />,
      onOk: async () => {
        try {
          await api.post(`/outsourcing_orders/${o.id}/complete`, { received_qty: recvQty ?? o.quantity });
          message.success('已完工并入库'); fetchAll();
        } catch (e: any) { message.error(e?.response?.data?.message || '完工失败'); }
      },
    });
  };

  const handleEntry = async (o: OutsourcingOrder) => {
    let qty: number | null = null;
    Modal.confirm({
      title: `委外领用 - ${o.order_no}`,
      content: <InputNumber min={0} defaultValue={o.quantity} onChange={v => { qty = v; }} />,
      onOk: async () => {
        try {
          await api.post(`/outsourcing_orders/${o.id}/entry`, { quantity: qty ?? 0 });
          message.success('已领用'); fetchAll();
        } catch (e: any) { message.error(e?.response?.data?.message || '领用失败'); }
      },
    });
  };

  const handleSettle = async (o: OutsourcingOrder) => {
    let price: number | null = null;
    Modal.confirm({
      title: `委外结算 - ${o.order_no}`,
      content: <div><p>当前单价：¥{o.unit_price || 0}</p><InputNumber min={0} step={0.01} defaultValue={o.unit_price} onChange={v => { price = v; }} addonBefore="¥" /></div>,
      onOk: async () => {
        try { await api.post(`/outsourcing_orders/${o.id}/settle`, { unit_price: price ?? o.unit_price }); message.success('已结算'); fetchAll(); }
        catch (e: any) { message.error(e?.response?.data?.message || '结算失败'); }
      },
    });
  };

  const handleCancel = async (o: OutsourcingOrder) => {
    let reason = '';
    Modal.confirm({
      title: `取消委外 - ${o.order_no}`,
      content: <Input placeholder="取消原因" onChange={e => { reason = e.target.value; }} />,
      onOk: async () => {
        if (!reason) { message.warning('请填写原因'); return Promise.reject(); }
        try { await api.post(`/outsourcing_orders/${o.id}/cancel`, { reason }); message.success('已取消'); fetchAll(); }
        catch (e: any) { message.error(e?.response?.data?.message || '取消失败'); }
      },
    });
  };

  const columns = [
    { title: '委外单号', dataIndex: 'order_no', width: 140, render: (v: string) => v || '-' },
    { title: '工单号', dataIndex: 'work_order_id', width: 80, render: (v: number) => v ? `#${v}` : '-' },
    { title: '客户', dataIndex: 'customer_id', width: 110, render: (v: number) => customerMap[v] || '-' },
    { title: '材料名称', dataIndex: 'material_name', width: 120 },
    { title: '规格', dataIndex: 'material_spec', width: 90, render: (v: string) => v || '-' },
    { title: '数量', dataIndex: 'quantity', width: 70, align: 'right' as const },
    { title: '已完成', dataIndex: 'received_qty', width: 70, align: 'right' as const, render: (v: number) => v || '-' },
    { title: '单价', dataIndex: 'unit_price', width: 80, align: 'right' as const, render: (v: number) => `¥${Number(v || 0).toFixed(2)}` },
    { title: '供应商', dataIndex: 'supplier_id', width: 70, render: (v: number) => suppliers.find(s => s.id === v)?.name || `#${v}` },
    { title: '状态', dataIndex: 'status', width: 80, render: (s: string) => <Tag color={getStatusColor(s)}>{s}</Tag> },
    { title: '结算', dataIndex: 'is_settled', width: 60, render: (v: number) => v ? <Tag color="green">已结</Tag> : <Tag>未结</Tag> },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right' as const,
      render: (_: any, r: OutsourcingOrder) => (
        <Space size={2}>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => { setDetail(r); setDetailOpen(true); }}>详情</Button>
          {r.status === '待加工' && (
            <>
              <Button size="small" type="link" onClick={() => handleComplete(r)}>完工</Button>
              <Button size="small" type="link" onClick={() => handleEntry(r)}>领用</Button>
              <Button size="small" type="link" danger onClick={() => handleCancel(r)}>取消</Button>
            </>
          )}
          {r.status === '已完成' && !r.is_settled && (
            <Button size="small" type="link" onClick={() => handleSettle(r)}>结算</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, background: '#fff', padding: '10px 16px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#1e40af' }}>委外管理</h2>
        <Space>
          <Input placeholder="搜索单号/材料" value={keyword} onChange={e => setKeyword(e.target.value)}
            style={{ width: 200 }} allowClear prefix={<SearchOutlined />} size="small" />
          <Button size="small" icon={<ReloadOutlined />} onClick={fetchAll}>刷新</Button>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleCreate}>新建委外</Button>
        </Space>
      </div>

      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: t => `共 ${t} 条`, size: 'small' }}
        scroll={{ x: 1400 }}
        locale={{ emptyText: <TableEmptyCell resource="委外单" actionText="新建委外" onAction={handleCreate} keyword={keyword} isDataEmpty={data.length === 0} /> }} />

      {/* 新建弹窗 — EX式单行添加 */}
      <Modal title="新建委外单" open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}
        okText="创建" cancelText="取消" width={700} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <div style={{ background: '#f0f5ff', padding: 12, borderRadius: 6, marginBottom: 12 }}>
            <Form.Item name="material_name" label="材料名称" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
              <Input placeholder="输入材料名称（如：A4纸箱面纸）" />
            </Form.Item>
            <Space wrap>
              <Form.Item name="material_spec" label="规格" style={{ marginBottom: 0 }}><Input style={{ width: 120 }} placeholder="规格" /></Form.Item>
              <Form.Item name="quantity" label="数量" rules={[{ required: true }]} style={{ marginBottom: 0 }}><InputNumber min={0} style={{ width: 100 }} /></Form.Item>
              <Form.Item name="unit" label="单位" initialValue="个" style={{ marginBottom: 0 }}><Input style={{ width: 70 }} /></Form.Item>
              <Form.Item name="unit_price" label="单价" style={{ marginBottom: 0 }}><InputNumber min={0} step={0.01} style={{ width: 110 }} /></Form.Item>
            </Space>
          </div>
          <Space wrap>
            <Form.Item name="supplier_id" label="供应商" rules={[{ required: true }]}>
              <Select showSearch placeholder="选择供应商" style={{ width: 180 }} optionFilterProp="label"
                options={suppliers.map(s => ({ value: s.id, label: s.name || s.contact || `ID:${s.id}` }))} />
            </Form.Item>
            <Form.Item name="work_order_id" label="关联工单"><InputNumber min={0} style={{ width: 100 }} placeholder="工单ID" /></Form.Item>
            <Form.Item name="planned_date" label="计划日期"><Input placeholder="YYYY-MM-DD" style={{ width: 130 }} /></Form.Item>
          </Space>
          <Space wrap>
            <Form.Item name="size_structure" label="尺寸结构"><Input style={{ width: 120 }} /></Form.Item>
            <Form.Item name="machine_size" label="上机尺寸cm"><Input style={{ width: 120 }} /></Form.Item>
            <Form.Item name="machine_quantity" label="上机数量"><InputNumber min={0} style={{ width: 100 }} /></Form.Item>
            <Form.Item name="print_color" label="印刷颜色"><Input style={{ width: 120 }} /></Form.Item>
          </Space>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal title={detail ? `委外详情 - ${detail.order_no || `#${detail.id}`}` : '委外详情'}
        open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={800} destroyOnClose>
        {detail && (
          <Descriptions size="small" column={3} bordered>
            <Descriptions.Item label="委外单号">{detail.order_no || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={getStatusColor(detail.status)}>{detail.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="结算">{detail.is_settled ? <Tag color="green">已结</Tag> : <Tag>未结</Tag>}</Descriptions.Item>
            <Descriptions.Item label="客户">{customerMap[detail.customer_id] || '-'}</Descriptions.Item>
            <Descriptions.Item label="工单">{detail.work_order_id ? `#${detail.work_order_id}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="供应商">{suppliers.find(s => s.id === detail.supplier_id)?.name || `#${detail.supplier_id}`}</Descriptions.Item>
            <Descriptions.Item label="材料名称">{detail.material_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="规格">{detail.material_spec || '-'}</Descriptions.Item>
            <Descriptions.Item label="单位">{detail.unit || '-'}</Descriptions.Item>
            <Descriptions.Item label="数量">{detail.quantity ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="完成数">{detail.finished_quantity || '-'}</Descriptions.Item>
            <Descriptions.Item label="已收货">{detail.received_qty || '-'}</Descriptions.Item>
            <Descriptions.Item label="单价">¥{Number(detail.unit_price || 0).toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="计划日期">{detail.planned_date?.split('T')[0] || detail.planned_date || '-'}</Descriptions.Item>
            <Descriptions.Item label="完成日期">{detail.completed_date?.split('T')[0] || detail.completed_date || '-'}</Descriptions.Item>
            <Descriptions.Item label="尺寸结构">{detail.size_structure || '-'}</Descriptions.Item>
            <Descriptions.Item label="上机尺寸">{detail.machine_size || '-'}</Descriptions.Item>
            <Descriptions.Item label="上机数量">{detail.machine_quantity || '-'}</Descriptions.Item>
            <Descriptions.Item label="印刷颜色">{detail.print_color || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{detail.remark || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
