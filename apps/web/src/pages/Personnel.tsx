import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Tag, Popconfirm, message, Modal, Form, Select } from 'antd';
import type { Personnel } from '../types/api';
import api from '../utils/axios';

const STATUS_OPTIONS = ['在职', '离职', '休假'];
const TYPE_OPTIONS = ['全职', '兼职', '临时'];

export default function Personnel() {
  const [data, setData] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Personnel | null>(null);
  const [form] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    api.get('/personnel').then((r) => setData(r.data)).catch(() => message.error('加载失败')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = data.filter((p) =>
    !keyword || p.name?.includes(keyword) || p.phone?.includes(keyword) || p.department?.includes(keyword)
  );

  const handleCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const handleEdit = (p: Personnel) => { setEditing(p); form.setFieldsValue(p); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editing) { await api.put(`/personnel/${editing.id}`, values); message.success('更新成功'); }
      else { await api.post('/personnel', values); message.success('创建成功'); }
      setModalOpen(false);
      fetchData();
    } catch (e: any) { if (!e.response) message.error('保存失败'); }
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/personnel/${id}`); message.success('已删除'); fetchData(); } catch { message.error('删除失败'); }
  };

  const statusColor = { '在职': 'green', '离职': 'red', '休假': 'orange' };

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name', render: (v: string) => v || '-' },
    { title: '类型', dataIndex: 'type', key: 'type', width: 80, render: (v: string) => v || '-' },
    { title: '部门', dataIndex: 'department', key: 'department', width: 100 },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v: string) => <Tag color={statusColor[v] || 'default'}>{v}</Tag> },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    {
      title: '操作', key: 'action', width: 120,
      render: (_: any, r: Personnel) => (
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
        <h2 style={{ margin: 0 }}>人员管理</h2>
        <Space>
          <Input placeholder="搜索姓名/电话/部门" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 200 }} allowClear />
          <Button type="primary" onClick={handleCreate}>新增人员</Button>
        </Space>
      </div>

      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 15 }} />

      <Modal title={editing ? '编辑人员' : '新增人员'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} okText="保存" cancelText="取消">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space wrap>
            <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input style={{ width: 140 }} /></Form.Item>
            <Form.Item name="type" label="类型"><Select allowClear options={TYPE_OPTIONS.map((t) => ({ value: t, label: t }))} style={{ width: 120 }} /></Form.Item>
            <Form.Item name="department" label="部门"><Input style={{ width: 140 }} /></Form.Item>
            <Form.Item name="phone" label="电话"><Input style={{ width: 140 }} /></Form.Item>
            <Form.Item name="status" label="状态" initialValue="在职"><Select options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} style={{ width: 120 }} /></Form.Item>
          </Space>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} style={{ width: 480 }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
