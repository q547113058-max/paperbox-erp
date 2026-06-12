import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Tag, message, Modal, Form, InputNumber, Select, Row, Col, Divider, Switch, Descriptions } from 'antd';
import type { Customer } from '../types/api';
import api from '../utils/axios';

const STATUS_OPTIONS = ['活跃', '暂停', '流失'];
const PAYMENT_CYCLE_OPTIONS = ['月结', '现结', '季结', '预付'];
const SETTLEMENT_OPTIONS = ['公户', '私户', '现金', '支票'];

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

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<Customer | null>(null);
  const openDetail = (c: Customer) => { setDetail(c); setDetailOpen(true); };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name', render: (v: string) => v || '-' },
    { title: '联系人', dataIndex: 'contact', key: 'contact' },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '地址', dataIndex: 'address', key: 'address', ellipsis: true },
    { title: '业务员', dataIndex: 'salesman', key: 'salesman', width: 90 },
    { title: '账期(天)', dataIndex: 'payment_days', key: 'payment_days', width: 90, align: 'right' as const, render: (v: number) => v || '-' },
    { title: '账期类型', dataIndex: 'payment_cycle', key: 'payment_cycle', width: 90 },
    { title: '结算方式', dataIndex: 'settlement_type', key: 'settlement_type', width: 90, render: (v: string) => v || '-' },
    { title: '含税', dataIndex: 'tax_included', key: 'tax_included', width: 80, render: (v: number) => v ? <Tag color="green">含税</Tag> : <Tag>不含税</Tag> },
    { title: '返点%', dataIndex: 'rebate_percent', key: 'rebate_percent', width: 80, align: 'right' as const, render: (v: number) => v ? `${v}%` : '-' },
    { title: '信用额度', dataIndex: 'credit_limit', key: 'credit_limit', width: 110, align: 'right' as const, render: (v: number) => v ? `¥${Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v: string) => <Tag color={v === '活跃' ? 'green' : v === '暂停' ? 'orange' : v === '流失' ? 'red' : 'default'}>{v || '活跃'}</Tag> },
    {
      title: '操作', key: 'action', width: 180, fixed: 'right' as const,
      render: (_: any, r: Customer) => (
        <Space size={4}>
          <Button size="small" type="link" onClick={() => openDetail(r)}>详情</Button>
          <Button size="small" type="link" onClick={() => handleEdit(r)}>编辑</Button>
          <Button size="small" type="link" danger onClick={() => Modal.confirm({ title: '确认删除？', content: `客户 ${r.name || `#${r.id}`} 将被删除`, okText: '删除', cancelText: '取消', okButtonProps: { danger: true }, onOk: () => handleDelete(r.id) })}>删除</Button>
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

      <Modal title={editing ? '编辑客户' : '新增客户'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} okText="保存" cancelText="取消" width={800} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>基本信息</Divider>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="name" label="名称" rules={[{ required: true }]}><Input placeholder="客户名称" /></Form.Item></Col>
            <Col span={8}><Form.Item name="contact" label="联系人"><Input placeholder="联系人" /></Form.Item></Col>
            <Col span={8}><Form.Item name="phone" label="电话"><Input placeholder="电话号码" /></Form.Item></Col>
          </Row>
          <Form.Item name="address" label="地址"><Input.TextArea rows={1} placeholder="详细地址" /></Form.Item>

          <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>业务信息</Divider>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="salesman" label="业务员"><Input placeholder="业务员" /></Form.Item></Col>
            <Col span={6}><Form.Item name="status" label="状态" initialValue="活跃"><Select options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} /></Form.Item></Col>
            <Col span={6}><Form.Item name="payment_days" label="账期(天)" initialValue={30}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item name="payment_cycle" label="账期类型" initialValue="月结"><Select options={PAYMENT_CYCLE_OPTIONS.map((s) => ({ value: s, label: s }))} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="credit_limit" label="信用额度"><InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="¥" /></Form.Item></Col>
            <Col span={6}><Form.Item name="rebate_percent" label="返点%"><InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0" /></Form.Item></Col>
            <Col span={6}><Form.Item name="settlement_type" label="结算方式" initialValue="公户"><Select options={SETTLEMENT_OPTIONS.map((s) => ({ value: s, label: s }))} /></Form.Item></Col>
            <Col span={6}><Form.Item name="tax_included" label="含税" valuePropName="checked" initialValue={1}><Switch checkedChildren="含税" unCheckedChildren="不含税" /></Form.Item></Col>
          </Row>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} placeholder="备注信息" /></Form.Item>
        </Form>
      </Modal>

      <Modal title={detail ? `客户详情 - ${detail.name || `#${detail.id}`}` : '客户详情'} open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={800} destroyOnClose>
        {detail && (
          <div>
            <Descriptions title="基本信息" size="small" column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="名称">{detail.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={detail.status === '活跃' ? 'green' : detail.status === '暂停' ? 'orange' : detail.status === '流失' ? 'red' : 'default'}>{detail.status || '活跃'}</Tag></Descriptions.Item>
              <Descriptions.Item label="联系人">{detail.contact || '-'}</Descriptions.Item>
              <Descriptions.Item label="电话">{detail.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>{detail.address || '-'}</Descriptions.Item>
              <Descriptions.Item label="业务员">{detail.salesman || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{detail.created_at?.split('T')[0] || detail.created_at || '-'}</Descriptions.Item>
            </Descriptions>
            <Descriptions title="财务信息" size="small" column={2} bordered>
              <Descriptions.Item label="账期(天)">{detail.payment_days || '-'}</Descriptions.Item>
              <Descriptions.Item label="账期类型">{detail.payment_cycle || '-'}</Descriptions.Item>
              <Descriptions.Item label="结算方式">{detail.settlement_type || '-'}</Descriptions.Item>
              <Descriptions.Item label="含税">{detail.tax_included ? <Tag color="green">含税</Tag> : <Tag>不含税</Tag>}</Descriptions.Item>
              <Descriptions.Item label="返点%">{detail.rebate_percent ? `${detail.rebate_percent}%` : '-'}</Descriptions.Item>
              <Descriptions.Item label="信用额度">{detail.credit_limit ? `¥${Number(detail.credit_limit).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{detail.remark || '-'}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
}
