import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Tag, Popconfirm, message, Modal, Form, InputNumber, Select, Image, Row, Col, Divider, Descriptions } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import type { Product } from '../types/api';
import api from '../utils/axios';
import { ImageUpload } from '../components/ImageUpload';
import { ExcelActions } from '../components/ExcelActions';
import { TableEmptyCell } from '../components/TableEmptyCell';
import { getStatusColor } from '../utils/statusColor';

const UNIT_OPTIONS = ['个', '套', '箱', '平方米', '米'];
const STATUS_OPTIONS = ['正常生产', '已停产', '开发中', '打样'];

/** 后端返回的完整 Product（含 entity 全部字段） */
type FullProduct = Product & {
  option_image?: string;
  print_plate?: string;
  finished_spec?: string;
  box_shape?: string;
  face_paper?: string;
  corrugated_paper?: string;
  print_colors?: string;
  surface_treatment?: string;
  processing?: string;
  accessories?: string;
  board_material?: string;
  board_spec?: string;
  colors?: string;
  knife_die_id?: number;
  face_paper_size?: string;
  corrugated_paper_size?: string;
  finished_product_image?: string;
  flute_type?: string;
  face_paper_2?: string;
  face_paper_size_2?: string;
  corrugated_paper_2?: string;
  corrugated_paper_size_2?: string;
  knife_die_id_2?: number;
  knife_die_2?: string;
  customer_code?: string;
  remark?: string;
};

const fmt = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '-';
  return String(v);
};

const fmtPrice = (v: unknown): string => {
  if (v === null || v === undefined || v === 0) return '-';
  return `¥${Number(v).toFixed(2)}`;
};

export default function Products() {
  const [data, setData] = useState<FullProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FullProduct | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<FullProduct | null>(null);
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
  const handleEdit = (p: FullProduct) => { setEditing(p); form.setFieldsValue(p); setModalOpen(true); };

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

  const handleViewDetail = (r: FullProduct) => {
    setDetailRecord(r);
    setDetailOpen(true);
  };

  const handlePrint = (r: FullProduct) => {
    const printUrl = `/api/print/product/${r.id}`;
    const w = window.open(printUrl, '_blank', 'width=900,height=700');
    if (!w) message.warning('请允许弹窗以查看打印');
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
    { title: '长×宽×高', key: 'size', width: 140, render: (_: any, r: FullProduct) => `${r.length}×${r.width}×${r.height}` },
    { title: '材质', dataIndex: 'material', key: 'material', width: 100 },
    { title: '盒型', dataIndex: 'box_type', key: 'box_type', width: 80, render: (v: string) => v || '-' },
    { title: '产品类型', dataIndex: 'product_type', key: 'product_type', width: 90, render: (v: string) => v || '-' },
    { title: '客户编码', dataIndex: 'customer_code', key: 'customer_code', width: 100, render: (v: string) => v || '-' },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 70 },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 90,
      align: 'right' as const,
      render: (v: number) => <span style={{ whiteSpace: 'nowrap' }}>{v ? `¥${Number(v).toFixed(2)}` : '-'}</span>
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (v: string) => <Tag color={getStatusColor(v)}>{v || '正常生产'}</Tag> },
    {
      title: '操作', key: 'action', width: 150, fixed: 'right' as const,
      render: (_: any, r: FullProduct) => (
        <Space>
          <Button size="small" type="link" onClick={() => handleViewDetail(r)}>详情</Button>
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
          <Button type="primary" onClick={handleCreate} style={{ backgroundColor: '#2c5282' }}>新增产品</Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        size="small"
        loading={loading}
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1600 }}
        locale={{ emptyText: <TableEmptyCell resource="产品" actionText="新增产品" onAction={handleCreate} keyword={keyword} isDataEmpty={data.length === 0} /> }}
      />

      {/* 编辑/新增弹窗 */}
      <Modal
        title={editing ? '编辑产品' : '新增产品'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        width={800}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          {/* 基本信息 */}
          <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>基本信息</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="code" label="产品编号" tooltip="留空自动生成 PK-001 格式">
                <Input placeholder="自动生成（如 PK-011）" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="name" label="产品名称">
                <Input placeholder="产品名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="spec" label="规格" rules={[{ required: true }]}>
                <Input placeholder="如 A-001" />
              </Form.Item>
            </Col>
          </Row>

          {/* 尺寸规格 */}
          <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>尺寸规格</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="material" label="材质">
                <Input placeholder="如 三层瓦楞" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="单位">
                <Select placeholder="选择单位" options={UNIT_OPTIONS.map((u) => ({ value: u, label: u }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="box_type" label="箱型">
                <Input placeholder="如 平口箱" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="product_type" label="产品类型">
                <Input placeholder="如 纸箱、彩盒" />
              </Form.Item>
            </Col>
          </Row>

          {/* 材料明细 */}
          <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>材料明细</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="face_paper" label="面纸材质">
                <Input placeholder="面纸材质" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="face_paper_size" label="面纸规格">
                <Input placeholder="面纸规格" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="corrugated_paper" label="坑纸材质">
                <Input placeholder="坑纸材质" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="corrugated_paper_size" label="坑纸规格">
                <Input placeholder="坑纸规格" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="board_material" label="纸板材质">
                <Input placeholder="纸板材质" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="board_spec" label="纸板规格">
                <Input placeholder="纸板规格" />
              </Form.Item>
            </Col>
          </Row>

          {/* 价格 */}
          <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>价格</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="unit_price" label="单价 (元)">
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="cost" label="成本 (元)">
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
          </Row>

          {/* 客户与备注 */}
          <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>客户与备注</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="customer_code" label="客户编码">
                <Input placeholder="客户方的产品编号" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} placeholder="备注信息" />
              </Form.Item>
            </Col>
          </Row>

          {/* 状态 */}
          <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>状态</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="status" label="生产状态" initialValue="正常生产">
                <Select options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
          </Row>

          {/* 产品图片 */}
          <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>产品图片</Divider>
          <Form.Item name="finished_product_image" label="成品图片">
            <ImageUpload />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title={<span style={{ color: '#2c5282', fontWeight: 600 }}>产品详情 - {detailRecord?.code || ''}</span>}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        width={800}
        destroyOnClose
        footer={[
          <Button key="print" icon={<PrinterOutlined />} style={{ color: '#2c5282', borderColor: '#2c5282' }} onClick={() => detailRecord && handlePrint(detailRecord)}>
            打印
          </Button>,
          <Button key="close" onClick={() => setDetailOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        {detailRecord && (
          <div>
            {/* 成品图片 */}
            {detailRecord.finished_product_image && (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Image src={detailRecord.finished_product_image} width={120} height={120} style={{ objectFit: 'cover', borderRadius: 4 }} />
              </div>
            )}

            {/* 基本信息 */}
            <Divider orientation="left" plain style={{ fontSize: 13, color: '#2c5282', margin: '0 0 8px' }}>基本信息</Divider>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="编号">{fmt(detailRecord.code)}</Descriptions.Item>
              <Descriptions.Item label="名称">{fmt(detailRecord.name)}</Descriptions.Item>
              <Descriptions.Item label="规格">{fmt(detailRecord.spec)}</Descriptions.Item>
              <Descriptions.Item label="盒型">{fmt(detailRecord.box_type)}</Descriptions.Item>
              <Descriptions.Item label="产品类型">{fmt(detailRecord.product_type)}</Descriptions.Item>
              <Descriptions.Item label="客户编码">{fmt(detailRecord.customer_code)}</Descriptions.Item>
              <Descriptions.Item label="单位">{fmt(detailRecord.unit)}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(detailRecord.status)}>{detailRecord.status || '正常生产'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{fmt(detailRecord.remark)}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>{fmt(detailRecord.created_at)}</Descriptions.Item>
            </Descriptions>

            {/* 尺寸材质 */}
            <Divider orientation="left" plain style={{ fontSize: 13, color: '#2c5282', margin: '0 0 8px' }}>尺寸材质</Divider>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="材质">{fmt(detailRecord.material)}</Descriptions.Item>
              <Descriptions.Item label="盒型形状">{fmt(detailRecord.box_shape)}</Descriptions.Item>
              <Descriptions.Item label="楞型">{fmt(detailRecord.flute_type)}</Descriptions.Item>
              <Descriptions.Item label="颜色">{fmt(detailRecord.colors)}</Descriptions.Item>
              <Descriptions.Item label="单位">{fmt(detailRecord.unit)}</Descriptions.Item>
              <Descriptions.Item label="箱型">{fmt(detailRecord.box_type)}</Descriptions.Item>
            </Descriptions>

            {/* 材料明细 */}
            <Divider orientation="left" plain style={{ fontSize: 13, color: '#2c5282', margin: '0 0 8px' }}>材料明细</Divider>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="面纸材质">{fmt(detailRecord.face_paper)}</Descriptions.Item>
              <Descriptions.Item label="面纸规格">{fmt(detailRecord.face_paper_size)}</Descriptions.Item>
              <Descriptions.Item label="坑纸材质">{fmt(detailRecord.corrugated_paper)}</Descriptions.Item>
              <Descriptions.Item label="坑纸规格">{fmt(detailRecord.corrugated_paper_size)}</Descriptions.Item>
              <Descriptions.Item label="纸板材质">{fmt(detailRecord.board_material)}</Descriptions.Item>
              <Descriptions.Item label="纸板规格">{fmt(detailRecord.board_spec)}</Descriptions.Item>
              {(detailRecord.face_paper_2 || detailRecord.corrugated_paper_2) && (
                <>
                  <Descriptions.Item label="面纸2材质">{fmt(detailRecord.face_paper_2)}</Descriptions.Item>
                  <Descriptions.Item label="面纸2规格">{fmt(detailRecord.face_paper_size_2)}</Descriptions.Item>
                  <Descriptions.Item label="坑纸2材质">{fmt(detailRecord.corrugated_paper_2)}</Descriptions.Item>
                  <Descriptions.Item label="坑纸2规格">{fmt(detailRecord.corrugated_paper_size_2)}</Descriptions.Item>
                </>
              )}
            </Descriptions>

            {/* 价格 */}
            <Divider orientation="left" plain style={{ fontSize: 13, color: '#2c5282', margin: '0 0 8px' }}>价格</Divider>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="单价">{fmtPrice(detailRecord.unit_price)}</Descriptions.Item>
              <Descriptions.Item label="成本">{fmtPrice(detailRecord.cost)}</Descriptions.Item>
            </Descriptions>

            {/* 印刷加工 */}
            <Divider orientation="left" plain style={{ fontSize: 13, color: '#2c5282', margin: '0 0 8px' }}>印刷加工</Divider>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="印刷色">{fmt(detailRecord.print_colors)}</Descriptions.Item>
              <Descriptions.Item label="印版">{fmt(detailRecord.print_plate)}</Descriptions.Item>
              <Descriptions.Item label="表面处理">{fmt(detailRecord.surface_treatment)}</Descriptions.Item>
              <Descriptions.Item label="加工处理">{fmt(detailRecord.processing)}</Descriptions.Item>
              <Descriptions.Item label="配件">{fmt(detailRecord.accessories)}</Descriptions.Item>
              <Descriptions.Item label="刀模">{fmt(detailRecord.knife_die)}</Descriptions.Item>
              {detailRecord.knife_die_2 && (
                <Descriptions.Item label="刀模2">{fmt(detailRecord.knife_die_2)}</Descriptions.Item>
              )}
              <Descriptions.Item label="产品图片" span={detailRecord.knife_die_2 ? 1 : 2}>
                {detailRecord.option_image ? <Image src={detailRecord.option_image} width={60} height={60} style={{ objectFit: 'cover' }} /> : '-'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
}
