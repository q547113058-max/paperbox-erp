import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Select, Input, Tag, Space, message, Descriptions, Card, Row, Col, Divider, Image, Popconfirm } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import api from '../utils/axios';
import { TableEmptyCell } from '../components/TableEmptyCell';
import { getStatusColor } from '../utils/statusColor';
import { ImageUpload } from '../components/ImageUpload';

export default function ColorPrints() {
  const [prints, setPrints] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedPrint, setSelectedPrint] = useState<any>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/color_prints'),
      api.get('/products'),
      api.get('/customers'),
    ]).then(([cp, prod, cust]) => {
      setPrints(cp.data);
      setProducts(prod.data);
      setCustomers(cust.data);
    }).catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = prints.filter((p) =>
    !keyword || p.print_no?.includes(keyword) || p.name?.includes(keyword)
  );

  const handleCreate = async (keepOpen?: boolean, _e?: React.MouseEvent) => {
    try {
      const vals = await createForm.validateFields();
      const items = vals.items || (vals.item_name ? [vals] : []);
      await api.post('/color_prints', {
        name: vals.name,
        product_id: vals.product_id,
        customer_id: vals.customer_id,
        remark: vals.remark,
        items: items.map((it: any) => ({
          item_name: it.item_name,
          size_structure: it.size_structure,
          material_name: it.material_name,
          machine_size: it.machine_size,
          remark: it.remark,
        })),
      });
      message.success('创建成功');
      if (keepOpen === true) { createForm.resetFields(); load(); }
      else { setShowCreate(false); createForm.resetFields(); load(); }
    } catch (e: any) {
      if (!e.response) message.error('保存失败');
    }
  };

  const handleEdit = async () => {
    try {
      const vals = await editForm.validateFields();
      await api.put(`/color_prints/${selectedPrint.id}`, vals);
      message.success('更新成功');
      setShowEdit(false);
      load();
      if (showDetail) viewDetail(selectedPrint);
    } catch (e: any) {
      if (!e.response) message.error('保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/color_prints/${id}`); message.success('已删除'); load(); } catch { message.error('删除失败'); }
  };

  const viewDetail = async (print: any) => {
    try {
      const res = await api.get(`/color_prints/${print.id}`);
      setSelectedPrint(res.data);
      setShowDetail(true);
    } catch {
      message.error('加载详情失败');
    }
  };

  const openEdit = (print: any) => {
    setSelectedPrint(print);
    editForm.setFieldsValue({
      name: print.name,
      product_id: print.product_id,
      customer_id: print.customer_id,
      status: print.status,
      remark: print.remark,
    });
    setShowEdit(true);
  };

  const columns = [
    { title: '彩印编号', dataIndex: 'print_no', width: 130, render: (v: string, r: any) => <a onClick={() => viewDetail(r)}>{v}</a> },
    { title: '名称', dataIndex: 'name', width: 180 },
    { title: '关联产品', dataIndex: 'product_name', width: 150, render: (v: string) => v || '-' },
    { title: '客户', dataIndex: 'customer_name', width: 120, render: (v: string) => v || '-' },
    { title: '印件数', dataIndex: 'item_count', width: 80, align: 'right' as const },
    { title: '图片数', dataIndex: 'image_count', width: 80, align: 'right' as const },
    { title: '印刷色', dataIndex: 'print_color', width: 120, render: (v: string) => v || '-' },
    { title: '表面处理', dataIndex: 'surface_treatment', width: 110, render: (v: string) => v || '-' },
    { title: '状态', dataIndex: 'status', width: 80, align: 'center' as const, render: (s: string) => <Tag color={getStatusColor(s || '正常')}>{s || '正常'}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', width: 160 },
    {
      title: '操作', width: 240, fixed: 'right' as const,
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => viewDetail(r)}>详情</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>🎨 彩印管理</h2>
        <Space>
          <Input placeholder="搜索单号/名称" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 200 }} allowClear />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setShowCreate(true); }}>新建彩印</Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{prints.length}</div>
              <div>总彩印数</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {prints.filter(p => p.status === '正常').length}
              </div>
              <div>正常</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {prints.reduce((sum: number, p: any) => sum + (p.item_count || 0), 0)}
              </div>
              <div>总印件数</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                {prints.reduce((sum: number, p: any) => sum + (p.image_count || 0), 0)}
              </div>
              <div>总图片数</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 15 }} scroll={{ x: 1200 }}
        locale={{ emptyText: <TableEmptyCell resource="彩印记录" actionText="新建彩印" onAction={handleCreate} keyword={keyword} isDataEmpty={prints.length === 0} /> }}
      />

      {/* 新建彩印 */}
      <Modal title="新建彩印" open={showCreate} onCancel={() => setShowCreate(false)} footer={[
        <Button key="cancel" onClick={() => setShowCreate(false)}>取消</Button>,
        <Button key="saveContinue" onClick={() => handleCreate(true)}>保存并新建</Button>,
        <Button key="save" type="primary" onClick={() => handleCreate(false)}>创建</Button>,
      ]} width={700} destroyOnClose>
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Space wrap style={{ width: '100%' }}>
            <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input style={{ width: 200 }} /></Form.Item>
            <Form.Item name="product_id" label="关联产品">
              <Select showSearch style={{ width: 200 }} options={products.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))} allowClear />
            </Form.Item>
            <Form.Item name="customer_id" label="客户">
              <Select showSearch style={{ width: 160 }} options={customers.map(c => ({ value: c.id, label: c.name }))} allowClear />
            </Form.Item>
          </Space>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
          <Divider orientation="left">印件信息</Divider>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }) => (
                  <Card key={key} size="small" style={{ marginBottom: 8 }}>
                    <Space wrap>
                      <Form.Item name={[name, 'item_name']} label="印件名称"><Input style={{ width: 140 }} /></Form.Item>
                      <Form.Item name={[name, 'size_structure']} label="尺寸结构"><Input style={{ width: 120 }} /></Form.Item>
                      <Form.Item name={[name, 'material_name']} label="材料"><Input style={{ width: 120 }} /></Form.Item>
                      <Form.Item name={[name, 'machine_size']} label="机器尺寸"><Input style={{ width: 120 }} /></Form.Item>
                      <Button danger onClick={() => remove(name)}>删除</Button>
                    </Space>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ width: '100%' }}>添加印件</Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* 编辑彩印 */}
      <Modal title="编辑彩印" open={showEdit} onOk={handleEdit} onCancel={() => setShowEdit(false)} okText="保存" cancelText="取消" width={600} destroyOnClose>
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="product_id" label="关联产品">
            <Select showSearch options={products.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))} allowClear />
          </Form.Item>
          <Form.Item name="customer_id" label="客户">
            <Select showSearch options={customers.map(c => ({ value: c.id, label: c.name }))} allowClear />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[{ value: '正常', label: '正常' }, { value: '停用', label: '停用' }]} />
          </Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal title={`彩印详情 - ${selectedPrint?.name || ''}`} open={showDetail} onCancel={() => setShowDetail(false)} footer={null} width={900} destroyOnClose>
        {selectedPrint && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="彩印编号">{selectedPrint.print_no}</Descriptions.Item>
              <Descriptions.Item label="名称">{selectedPrint.name}</Descriptions.Item>
              <Descriptions.Item label="关联产品">{selectedPrint.product_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="客户">{selectedPrint.customer_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={getStatusColor(selectedPrint.status || '正常')}>{selectedPrint.status || '正常'}</Tag></Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedPrint.created_at}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{selectedPrint.remark || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">印件列表</Divider>
            {selectedPrint.items && selectedPrint.items.length > 0 ? (
              selectedPrint.items.map((item: any) => (
                <Card key={item.id} size="small" style={{ marginBottom: 8 }}>
                  <Space>
                    <span><strong>印件名称：</strong>{item.item_name || '-'}</span>
                    <span><strong>尺寸结构：</strong>{item.size_structure || '-'}</span>
                    <span><strong>材料：</strong>{item.material_name || '-'}</span>
                    <span><strong>机器尺寸：</strong>{item.machine_size || '-'}</span>
                  </Space>
                  {item.images && item.images.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Image.PreviewGroup>
                        {item.images.map((img: any) => (
                          <Image key={img.id} src={img.image_path} width={60} height={60} style={{ objectFit: 'cover', marginRight: 8 }} />
                        ))}
                      </Image.PreviewGroup>
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <p style={{ color: '#999' }}>暂无印件</p>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}