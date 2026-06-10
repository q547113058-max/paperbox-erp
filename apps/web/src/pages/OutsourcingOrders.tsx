import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Tag, message, Modal, Form, InputNumber, Select, Row, Col, Divider, Switch, Descriptions } from 'antd';
import type { OutsourcingOrder } from '../types/api';
import api from '../utils/axios';
import { TableEmptyCell } from '../components/TableEmptyCell';
import { getStatusColor } from '../utils/statusColor';

const STATUS_COLOR: Record<string, string> = {
  '待加工': 'orange',
  '已完成': 'green',
  '已取消': 'red',
};

export default function OutsourcingOrders() {
  const [data, setData] = useState<OutsourcingOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchAll = () => {
    setLoading(true);
    api.get('/outsourcing_orders').then((r) => setData(r.data))
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); api.get('/customers').then(r => { const m: Record<number, string> = {}; (r.data || []).forEach((c: any) => { m[c.id] = c.name || `ID:${c.id}`; }); setCustomerMap(m); }).catch(()=>{}); }, []);

  const filtered = data.filter((o) =>
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
      if (!e.response) message.error('保存失败');
    }
  };

  const handleComplete = async (o: OutsourcingOrder) => {
    let recvQty: number | null = null;
    Modal.confirm({
      title: `委外完工 - ${o.order_no}`,
      content: (
        <div>
          <p>请输入实际收货数量：</p>
          <InputNumber min={0} defaultValue={o.quantity} onChange={(v) => { recvQty = v; }} />
        </div>
      ),
      onOk: async () => {
        try {
          await api.post(`/outsourcing_orders/${o.id}/complete`, { received_qty: recvQty ?? o.quantity });
          message.success('已完工并入库');
          fetchAll();
        } catch (e: any) {
          message.error(e.response?.data?.message || '完工失败');
        }
      },
    });
  };

  const handleEntry = async (o: OutsourcingOrder) => {
    let qty: number | null = null;
    Modal.confirm({
      title: `委外领用 - ${o.order_no}`,
      content: (
        <div>
          <p>请输入领用数量：</p>
          <InputNumber min={0} defaultValue={o.quantity} onChange={(v) => { qty = v; }} />
        </div>
      ),
      onOk: async () => {
        try {
          await api.post(`/outsourcing_orders/${o.id}/entry`, { quantity: qty ?? 0 });
          message.success('已领用');
          fetchAll();
        } catch (e: any) {
          message.error(e.response?.data?.message || '领用失败');
        }
      },
    });
  };

  const handleSettle = async (o: OutsourcingOrder) => {
    let price: number | null = null;
    Modal.confirm({
      title: `委外结算 - ${o.order_no}`,
      content: (
        <div>
          <p>当前单价：¥{o.unit_price || 0}</p>
          <InputNumber min={0} step={0.01} defaultValue={o.unit_price} onChange={(v) => { price = v; }} addonBefore="¥" />
        </div>
      ),
      onOk: async () => {
        try {
          await api.post(`/outsourcing_orders/${o.id}/settle`, { unit_price: price ?? o.unit_price });
          message.success('已结算');
          fetchAll();
        } catch (e: any) {
          message.error(e.response?.data?.message || '结算失败');
        }
      },
    });
  };

  const handleCancel = async (o: OutsourcingOrder) => {
    let reason = '';
    Modal.confirm({
      title: `取消委外 - ${o.order_no}`,
      content: (
        <Input placeholder="取消原因" onChange={(e) => { reason = e.target.value; }} />
      ),
      onOk: async () => {
        if (!reason) { message.warning('请填写原因'); return Promise.reject(); }
        try {
          await api.post(`/outsourcing_orders/${o.id}/cancel`, { reason });
          message.success('已取消');
          fetchAll();
        } catch (e: any) {
          message.error(e.response?.data?.message || '取消失败');
        }
      },
    });
  };

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<OutsourcingOrder | null>(null);
  const [customerMap, setCustomerMap] = useState<Record<number, string>>({});

  const openDetail = (o: OutsourcingOrder) => { setDetail(o); setDetailOpen(true); };
  const handleDetailPrint = () => { if (detail) { const w = window.open(`/api/print/outsourcing_order/${detail.id}`, '_blank', 'width=900,height=700'); if (!w) message.warning('请允许弹窗以查看打印'); } };

  const columns = [
    { title: '委外单号', dataIndex: 'order_no', key: 'order_no', width: 150 },
    { title: '工单号', dataIndex: 'work_order_id', key: 'work_order_id', width: 90, render: (v: number) => v ? `#${v}` : '-' },
    { title: '客户', dataIndex: 'customer_id', key: 'customer', width: 130, render: (v: number) => customerMap[v] || '未关联' },
    { title: '印件名称', dataIndex: 'material_name', key: 'material_name', width: 130 },
    { title: '规格', dataIndex: 'material_spec', key: 'material_spec', width: 100 },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'right' as const },
    { title: '完成数', dataIndex: 'finished_quantity', key: 'finished_quantity', width: 80, align: 'right' as const, render: (v: number) => v ?? '-' },
    { title: '已收货', dataIndex: 'received_qty', key: 'received_qty', width: 80, align: 'right' as const, render: (v: number) => v || '-' },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
    { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 80, align: 'right' as const, render: (v: number) => `¥${Number(v || 0).toFixed(2)}` },
    { title: '上机尺寸cm', dataIndex: 'machine_size', key: 'machine_size', width: 100, render: (v: string) => v || '-' },
    { title: '上机数量', dataIndex: 'machine_quantity', key: 'machine_quantity', width: 80, align: 'right' as const, render: (v: number) => v || '-' },
    { title: '尺寸结构', dataIndex: 'size_structure', key: 'size_structure', width: 110, render: (v: string) => v || '-' },
    { title: '印刷颜色', dataIndex: 'print_color', key: 'print_color', width: 100, render: (v: string) => v || '-' },
    { title: '供应商', dataIndex: 'supplier_id', key: 'supplier_id', width: 80 },
    { title: '计划日期', dataIndex: 'planned_date', key: 'planned_date', width: 110, render: (v: string) => v?.split('T')[0] || v || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, align: 'center' as const, render: (s: string) => <Tag color={getStatusColor(s)}>{s}</Tag> },
    { title: '已结算', dataIndex: 'is_settled', key: 'is_settled', width: 80, render: (v: number) => v ? <Tag color="green">已结</Tag> : <Tag>未结</Tag> },
    {
      title: '操作', key: 'action', width: 250, fixed: 'right' as const,
      render: (_: any, r: OutsourcingOrder) => (
        <Space size={4}>
          <Button size="small" type="link" onClick={() => openDetail(r)}>详情</Button>
          {r.status === '待加工' && (
            <>
              <Button size="small" type="link" onClick={() => handleComplete(r)}>完工</Button>
              <Button size="small" type="link" onClick={() => handleEntry(r)}>领用</Button>
              <Button size="small" type="link" danger onClick={() => handleCancel(r)}>取消</Button>
            </>
          )}
          {r.status === '已完成' && r.is_settled === 0 && (
            <Button size="small" type="link" onClick={() => handleSettle(r)}>结算</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>委外管理</h2>
        <Space>
          <Input placeholder="搜索单号/材料" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 200 }} allowClear />
          <Button type="primary" onClick={handleCreate}>新建委外</Button>
        </Space>
      </div>
      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 15 }} scroll={{ x: 1400 }}
        locale={{ emptyText: <TableEmptyCell resource="委外单" actionText="新建委外" onAction={handleCreate} keyword={keyword} isDataEmpty={data.length === 0} /> }}
      />

      <Modal title="新建委外单" open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} okText="保存" cancelText="取消" width={600} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="work_order_id" label="关联工单ID"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="material_name" label="材料名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="material_spec" label="规格"><Input /></Form.Item>
          <Space>
            <Form.Item name="quantity" label="数量" rules={[{ required: true }]}><InputNumber min={0} style={{ width: 120 }} /></Form.Item>
            <Form.Item name="unit" label="单位" initialValue="个"><Input style={{ width: 80 }} /></Form.Item>
            <Form.Item name="unit_price" label="单价"><InputNumber min={0} step={0.01} style={{ width: 120 }} /></Form.Item>
          </Space>
          <Form.Item name="supplier_id" label="供应商ID" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal title={detail ? `委外详情 - ${detail.order_no || `#${detail.id}`}` : '委外详情'} open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={800} destroyOnClose>
        {detail && (
          <div>
            <Descriptions title="基本信息" size="small" column={3} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="委外单号">{detail.order_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={getStatusColor(detail.status)}>{detail.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="已结算">{detail.is_settled ? <Tag color="green">已结</Tag> : <Tag>未结</Tag>}</Descriptions.Item>
              <Descriptions.Item label="客户">{customerMap[detail.customer_id] || '未关联'}</Descriptions.Item>
              <Descriptions.Item label="关联工单">{detail.work_order_id ? `#${detail.work_order_id}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="供应商">#{detail.supplier_id}</Descriptions.Item>
              <Descriptions.Item label="计划日期">{detail.planned_date?.split('T')[0] || detail.planned_date || '-'}</Descriptions.Item>
              <Descriptions.Item label="完成日期">{detail.completed_date?.split('T')[0] || detail.completed_date || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{detail.created_at?.split('T')[0] || detail.created_at || '-'}</Descriptions.Item>
            </Descriptions>
            <Descriptions title="物料" size="small" column={3} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="印件名称">{detail.material_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="规格">{detail.material_spec || '-'}</Descriptions.Item>
              <Descriptions.Item label="单位">{detail.unit || '-'}</Descriptions.Item>
              <Descriptions.Item label="数量">{detail.quantity ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="完成数">{detail.finished_quantity || '-'}</Descriptions.Item>
              <Descriptions.Item label="已收货">{detail.received_qty || '-'}</Descriptions.Item>
              <Descriptions.Item label="单价">¥{Number(detail.unit_price || 0).toFixed(2)}</Descriptions.Item>
            </Descriptions>
            <Descriptions title="印刷/上机" size="small" column={3} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="尺寸结构">{detail.size_structure || '-'}</Descriptions.Item>
              <Descriptions.Item label="上机尺寸cm">{detail.machine_size || '-'}</Descriptions.Item>
              <Descriptions.Item label="上机数量">{detail.machine_quantity || '-'}</Descriptions.Item>
              <Descriptions.Item label="纸张开数">{detail.paper_size || '-'}</Descriptions.Item>
              <Descriptions.Item label="印刷颜色">{detail.print_color || '-'}</Descriptions.Item>
              <Descriptions.Item label="表面处理">{detail.surface_treatment || '-'}</Descriptions.Item>
              <Descriptions.Item label="追色版本">{detail.follow_version || '-'}</Descriptions.Item>
            </Descriptions>
            <Descriptions title="备注" size="small" column={1} bordered>
              <Descriptions.Item label="备注">{detail.remark || '-'}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button type="primary" onClick={handleDetailPrint}>打印委外单</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}