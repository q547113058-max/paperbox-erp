import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Image, message, Divider, Dropdown, Descriptions } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, EyeOutlined, MoreOutlined, UserAddOutlined } from '@ant-design/icons';
import api from '../utils/axios';
import { TableEmptyCell } from '../components/TableEmptyCell';
import { ImageUpload } from '../components/ImageUpload';

export default function KnifeDies() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState<any[]>([]);
  const [boxTypes, setBoxTypes] = useState<string[]>([]);
  const [dieCuttings, setDieCuttings] = useState<string[]>([]);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/knife_dies'),
      api.get('/customers'),
      api.get('/spec_options'),
    ]).then(([kd, cust, spec]) => {
      setData(kd.data);
      setCustomers(cust.data);
      const all = spec.data || [];
      const inner = all.filter((o: any) => o.category === 'inner_box_shape').map((o: any) => o.value);
      const carton = all.filter((o: any) => o.category === 'carton_shape').map((o: any) => o.value);
      setBoxTypes([...inner, ...carton]);
      setDieCuttings(all.filter((o: any) => o.category === '模切').map((o: any) => o.value));
    }).catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = data.filter((d) =>
    !keyword || d.code?.includes(keyword) || d.customer?.includes(keyword) || d.product_name?.includes(keyword)
  );

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ fee: 0 }); setModalOpen(true); };
  const openEdit = (record: any) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await api.put(`/knife_dies/${editing.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/knife_dies', values);
        message.success('新建成功');
      }
      setModalOpen(false);
      fetchAll();
    } catch (e: any) {
      if (!e.response) message.error('保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/knife_dies/${id}`); message.success('已删除'); fetchAll(); } catch { message.error('删除失败'); }
  };

  const openDetail = (r: any) => { setDetail(r); setDetailOpen(true); };

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) { message.warning('请输入客户名称'); return; }
    try {
      await api.post('/customers', { name: newCustomerName.trim() });
      message.success('客户已添加');
      setAddCustomerOpen(false);
      setNewCustomerName('');
      fetchAll();
    } catch (e: any) { message.error(e.response?.data?.message || '添加客户失败'); }
  };

  const columns = [
    { title: '刀模号', dataIndex: 'code', key: 'code', width: 100 },
    { title: '客户', dataIndex: 'customer', key: 'customer', width: 140, render: (v: string) => v || '-' },
    { title: '制品名称', dataIndex: 'product_name', key: 'product_name', width: 140, render: (v: string) => v || '-' },
    { title: '产品规格(cm)', dataIndex: 'spec_cm', key: 'spec_cm', width: 120, render: (v: string) => v || '-' },
    { title: '模板尺寸(mm)', dataIndex: 'template_mm', key: 'template_mm', width: 120, render: (v: string) => v || '-' },
    { title: '模切', dataIndex: 'die_cutting', key: 'die_cutting', width: 90, render: (v: string) => v || '-' },
    { title: '盒型', dataIndex: 'box_type', key: 'box_type', width: 90, render: (v: string) => v || '-' },
    { title: '刀模费', dataIndex: 'fee', key: 'fee', width: 90, align: 'right' as const, render: (v: number) => `¥${Number(v || 0).toFixed(2)}` },
    { title: '图片', dataIndex: 'image', key: 'image', width: 70, render: (img: string) => img ? <Image src={img} width={50} height={50} style={{ objectFit: 'cover', borderRadius: 4 }} /> : '—' },
    {
      title: '操作', key: 'action', width: 150, fixed: 'right' as const,
      render: (_: any, record: any) => {
        const moreItems = [
          { key: 'delete', label: '删除', danger: true, icon: <DeleteOutlined />, onClick: () => Modal.confirm({ title: '确认删除？', content: `刀模 ${record.code} 将被删除`, okText: '删除', okButtonProps: { danger: true }, onOk: () => handleDelete(record.id) }) },
        ];
        return (
          <Space>
            <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>详情</Button>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
            <Dropdown trigger={['click']} placement="bottomRight" menu={{ items: moreItems }}>
              <Button size="small" icon={<MoreOutlined />}>更多</Button>
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>🗡️ 刀模管理</h2>
        <Space>
          <Input placeholder="搜索刀模号/客户/制品名称" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 250 }} allowClear />
          <Button icon={<UserAddOutlined />} onClick={() => setAddCustomerOpen(true)}>添加客户</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建</Button>
        </Space>
      </div>

      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 15 }} scroll={{ x: 1200 }}
        locale={{ emptyText: <TableEmptyCell resource="刀模" actionText="新建刀模" onAction={openCreate} keyword={keyword} isDataEmpty={data.length === 0} /> }}
      />

      <Modal title={editing ? '编辑刀模' : '新建刀模'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} okText="保存" cancelText="取消" width={620} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space wrap style={{ width: '100%' }}>
            <Form.Item name="code" label="刀模号" rules={[{ required: true }]}><Input style={{ width: 160 }} /></Form.Item>
            <Form.Item name="box_type" label="盒型" initialValue="平口箱">
              <Select style={{ width: 140 }} options={boxTypes.map(v => ({ value: v, label: v }))} />
            </Form.Item>
            <Form.Item name="customer" label="客户">
              <Select showSearch style={{ width: 160 }} options={customers.map(c => ({ value: c.name, label: c.name }))} allowClear />
            </Form.Item>
            <Form.Item name="fee" label="刀模费(元)"><InputNumber min={0} step={0.01} style={{ width: 120 }} /></Form.Item>
          </Space>
          <Form.Item name="product_name" label="制品名称"><Input /></Form.Item>
          <Space wrap>
            <Form.Item name="spec_cm" label="产品规格(cm)"><Input style={{ width: 160 }} placeholder="如 30×20×10" /></Form.Item>
            <Form.Item name="template_mm" label="模板尺寸(mm)"><Input style={{ width: 160 }} placeholder="如 800×600" /></Form.Item>
            <Form.Item name="die_cutting" label="模切">
              <Select style={{ width: 140 }} options={dieCuttings.map(v => ({ value: v, label: v }))} allowClear />
            </Form.Item>
          </Space>
          <Form.Item name="image" label="刀模图片">
            <ImageUpload />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={detail ? `刀模详情 - ${detail.code || `#${detail.id}`}` : '刀模详情'} open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={700} destroyOnClose>
        {detail && (
          <Descriptions bordered size="small" column={2} style={{ marginTop: 16 }}>
            <Descriptions.Item label="刀模号">{detail.code || '-'}</Descriptions.Item>
            <Descriptions.Item label="客户">{detail.customer || '-'}</Descriptions.Item>
            <Descriptions.Item label="制品名称" span={2}>{detail.product_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="盒型">{detail.box_type || '-'}</Descriptions.Item>
            <Descriptions.Item label="模切">{detail.die_cutting || '-'}</Descriptions.Item>
            <Descriptions.Item label="产品规格(cm)">{detail.spec_cm || '-'}</Descriptions.Item>
            <Descriptions.Item label="模板尺寸(mm)">{detail.template_mm || '-'}</Descriptions.Item>
            <Descriptions.Item label="面纸孔高(mm)">{detail.face_hole_height}</Descriptions.Item>
            <Descriptions.Item label="面纸长(mm)">{detail.face_paper_length}</Descriptions.Item>
            <Descriptions.Item label="坑纸孔高(mm)">{detail.corrugated_hole_height}</Descriptions.Item>
            <Descriptions.Item label="坑纸长(mm)">{detail.corrugated_paper_length}</Descriptions.Item>
            <Descriptions.Item label="刀模费">¥{Number(detail.fee || 0).toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>{detail.created_at || '-'}</Descriptions.Item>
            {detail.image && (
              <Descriptions.Item label="刀模图片" span={2}>
                <Image src={detail.image} width={200} style={{ borderRadius: 4 }} />
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      <Modal title="添加客户" open={addCustomerOpen} onOk={handleAddCustomer} onCancel={() => { setAddCustomerOpen(false); setNewCustomerName(''); }} okText="添加" cancelText="取消" destroyOnClose>
        <p style={{ color: '#64748b' }}>添加新客户到客户管理（仅名称，详细信息请到客户管理页完善）</p>
        <Input placeholder="客户名称" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} onPressEnter={handleAddCustomer} autoFocus />
      </Modal>
    </div>
  );
}