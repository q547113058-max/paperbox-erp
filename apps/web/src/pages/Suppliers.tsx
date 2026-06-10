import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Tag, message, Modal, Form, InputNumber, Select, Row, Col, Divider, Descriptions, Dropdown } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, MoreOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Supplier } from '../types/api';
import api from '../utils/axios';

const PAYMENT_CYCLE_OPTIONS = ['月结', '现结', '季结', '预付'];
const SUPPLIER_TYPE_OPTIONS = ['原材料', '辅料', '加工', '设备', '其他'];
const SETTLEMENT_OPTIONS = ['公户', '私户', '现金'];

export default function Suppliers() {
  const [data, setData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Supplier | null>(null);
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
  const handleDetail = (s: Supplier) => { setDetailRecord(s); setDetailOpen(true); };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editing) { await api.put(`/suppliers/${editing.id}`, values); message.success('更新成功'); }
      else { await api.post('/suppliers', values); message.success('创建成功'); }
      setModalOpen(false);
      fetchData();
    } catch (e: any) { if (!e.response) message.error('保存失败'); }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除该供应商吗？',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try { await api.delete(`/suppliers/${id}`); message.success('已删除'); fetchData(); } catch { message.error('删除失败'); }
      },
    });
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name', render: (v: string) => v || '-' },
    { title: '联系人', dataIndex: 'contact', key: 'contact' },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '类型', dataIndex: 'supplier_type', key: 'supplier_type', width: 90 },
    { title: '主营', dataIndex: 'material_type', key: 'material_type', width: 100 },
    { title: '结算方式', dataIndex: 'settlement_type', key: 'settlement_type', width: 90 },
    { title: '账期', dataIndex: 'payment_cycle', key: 'payment_cycle', width: 80 },
    { title: '账期天数', dataIndex: 'payment_days', key: 'payment_days', width: 80 },
    { title: '额度', dataIndex: 'credit_limit', key: 'credit_limit', width: 90, render: (v: number) => v ? `¥${v.toLocaleString()}` : '-' },
    { title: '返点%', dataIndex: 'rebate_percent', key: 'rebate_percent', width: 80, render: (v: number) => v ? `${v}%` : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v: string) => <Tag color={v === '合作中' ? 'green' : 'default'}>{v}</Tag> },
    {
      title: '操作', key: 'action', width: 120, fixed: 'right' as const,
      render: (_: any, r: Supplier) => (
        <Space>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handleDetail(r)}>详情</Button>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: [
                { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(r.id) },
              ],
            }}
          >
            <Button size="small" type="link" icon={<MoreOutlined />} />
          </Dropdown>
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增供应商</Button>
        </Space>
      </div>

      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 15 }} scroll={{ x: 1200 }} />

      {/* 详情 Modal */}
      <Modal title="供应商详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={700} destroyOnClose>
        {detailRecord && (
          <>
            <Descriptions bordered size="small" column={2} title="基本信息" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="名称">{detailRecord.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={detailRecord.status === '合作中' ? 'green' : 'default'}>{detailRecord.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="联系人">{detailRecord.contact || '-'}</Descriptions.Item>
              <Descriptions.Item label="电话">{detailRecord.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>{detailRecord.address || '-'}</Descriptions.Item>
            </Descriptions>

            <Descriptions bordered size="small" column={2} title="供应信息" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="供应商类型">{detailRecord.supplier_type || '-'}</Descriptions.Item>
              <Descriptions.Item label="主营材料">{detailRecord.material_type || '-'}</Descriptions.Item>
              <Descriptions.Item label="结算方式">{detailRecord.settlement_type || '-'}</Descriptions.Item>
              <Descriptions.Item label="账期">{detailRecord.payment_cycle || '-'}</Descriptions.Item>
              <Descriptions.Item label="账期天数">{detailRecord.payment_days ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="返点%">{detailRecord.rebate_percent ? `${detailRecord.rebate_percent}%` : '-'}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{detailRecord.remark || '-'}</Descriptions.Item>
            </Descriptions>

            <Descriptions bordered size="small" column={2} title="财务信息">
              <Descriptions.Item label="信用额度">{detailRecord.credit_limit ? `¥${detailRecord.credit_limit.toLocaleString()}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{detailRecord.created_at || '-'}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>

      {/* 新增/编辑 Modal */}
      <Modal title={editing ? '编辑供应商' : '新增供应商'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} okText="保存" cancelText="取消" width={720} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>基本信息</Divider>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="name" label="名称" rules={[{ required: true }]}><Input placeholder="供应商名称" /></Form.Item></Col>
            <Col span={8}><Form.Item name="contact" label="联系人"><Input placeholder="联系人" /></Form.Item></Col>
            <Col span={8}><Form.Item name="phone" label="电话"><Input placeholder="电话号码" /></Form.Item></Col>
          </Row>

          <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>供应信息</Divider>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="supplier_type" label="供应商类型"><Select placeholder="选择类型" options={SUPPLIER_TYPE_OPTIONS.map((s) => ({ value: s, label: s }))} /></Form.Item></Col>
            <Col span={6}><Form.Item name="material_type" label="主营材料"><Input placeholder="如 面纸/坑纸" /></Form.Item></Col>
            <Col span={6}><Form.Item name="settlement_type" label="结算方式"><Select placeholder="选择结算" options={SETTLEMENT_OPTIONS.map((s) => ({ value: s, label: s }))} /></Form.Item></Col>
            <Col span={6}><Form.Item name="rebate_percent" label="返点%"><InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="payment_cycle" label="账期"><Select placeholder="选择账期" options={PAYMENT_CYCLE_OPTIONS.map((s) => ({ value: s, label: s }))} /></Form.Item></Col>
            <Col span={6}><Form.Item name="payment_days" label="账期天数"><InputNumber min={0} style={{ width: '100%' }} placeholder="0" /></Form.Item></Col>
            <Col span={6}><Form.Item name="credit_limit" label="信用额度 (元)"><InputNumber min={0} style={{ width: '100%' }} placeholder="0" /></Form.Item></Col>
            <Col span={6}><Form.Item name="status" label="状态"><Select options={[{ value: '合作中', label: '合作中' }, { value: '已停用', label: '已停用' }]} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}><Form.Item name="address" label="地址"><Input.TextArea rows={1} placeholder="详细地址" /></Form.Item></Col>
          </Row>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} placeholder="备注信息" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
