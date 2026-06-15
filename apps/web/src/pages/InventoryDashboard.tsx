import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Tabs, Input, Space, Empty, Progress } from 'antd';
import {
  AppstoreOutlined, InboxOutlined, ToolOutlined, PictureOutlined,
  ExperimentOutlined, ReloadOutlined, WarningOutlined,
} from '@ant-design/icons';
import api from '../utils/axios';

interface InventoryItem {
  id: number; name: string; stock_qty: number; safety_stock: number;
  unit?: string; spec?: string; status?: string;
}

export default function InventoryDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [knifeDies, setKnifeDies] = useState<any[]>([]);
  const [colorPrints, setColorPrints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, mRes, kRes, cRes] = await Promise.all([
        api.get('/products'),
        api.get('/materials'),
        api.get('/knife_dies'),
        api.get('/color_prints'),
      ]);
      setProducts(Array.isArray(pRes.data) ? pRes.data : []);
      setMaterials(Array.isArray(mRes.data) ? mRes.data : []);
      setKnifeDies(Array.isArray(kRes.data) ? kRes.data : []);
      setColorPrints(Array.isArray(cRes.data) ? cRes.data : []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const lowStockProducts = products.filter((p: any) => (p.stock_qty || 0) < (p.safety_stock || 0));
  const totalStock = products.reduce((s: number, p: any) => s + (p.stock_qty || 0), 0);

  const filterFn = (items: any[]) => {
    if (!search) return items;
    return items.filter((i: any) =>
      (i.name || '').includes(search) || (i.spec || '').includes(search) || (i.material_name || '').includes(search)
    );
  };

  const stockCols = (type: string) => [
    { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true, render: (v: string, r: any) => r.material_name || v || '-' },
    { title: '规格', dataIndex: 'spec', key: 'spec', render: (v: string) => v || '-' },
    ...(type === 'product' ? [
      { title: '库存量', dataIndex: 'stock_qty', key: 'stock_qty', render: (v: number, r: any) => {
        const safe = r.safety_stock || 0;
        return <span style={{ color: v < safe ? '#cf1322' : undefined }}>{v || 0}</span>;
      }},
      { title: '安全库存', dataIndex: 'safety_stock', key: 'safety_stock' },
      {
        title: '库存率', key: 'ratio', width: 100,
        render: (_: unknown, r: any) => {
          const safe = r.safety_stock || 1;
          const pct = Math.min(100, Math.round(((r.stock_qty || 0) / safe) * 100));
          return <Progress percent={pct} size="small" status={pct < 50 ? 'exception' : 'normal'} />;
        },
      },
    ] : [
      { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (v: any) => v || '-' },
    ]),
    ...(type === 'material' ? [
      { title: '类型', dataIndex: 'paper_type', key: 'paper_type', render: (v: string) => v || '-' },
    ] : []),
  ];

  const tabItems = [
    {
      key: 'products',
      label: `成品库存 (${products.length})`,
      children: (
        <Table rowKey="id" size="small" loading={loading}
          dataSource={filterFn(products)}
          columns={stockCols('product')}
          pagination={{ pageSize: 15 }}
        />
      ),
    },
    {
      key: 'materials',
      label: `纸板/材料库存 (${materials.length})`,
      children: (
        <Table rowKey="id" size="small" loading={loading}
          dataSource={filterFn(materials)}
          columns={stockCols('material')}
          pagination={{ pageSize: 15 }}
        />
      ),
    },
    {
      key: 'knife',
      label: `刀模库存 (${knifeDies.length})`,
      children: (
        <Table rowKey="id" size="small" loading={loading}
          dataSource={filterFn(knifeDies)}
          columns={[
            { title: '名称', dataIndex: 'name', key: 'name' },
            { title: '规格', dataIndex: 'spec', key: 'spec' },
            { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag>{v || '-'}</Tag> },
          ]}
          pagination={{ pageSize: 15 }}
        />
      ),
    },
    {
      key: 'color',
      label: `彩印版库存 (${colorPrints.length})`,
      children: (
        <Table rowKey="id" size="small" loading={loading}
          dataSource={filterFn(colorPrints)}
          columns={[
            { title: '名称', dataIndex: 'name', key: 'name' },
            { title: '规格', dataIndex: 'spec', key: 'spec' },
            { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag>{v || '-'}</Tag> },
          ]}
          pagination={{ pageSize: 15 }}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>库存总览</h2>
        <Space>
          <Input.Search placeholder="搜索名称/规格" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} allowClear />
          <ReloadOutlined onClick={fetchAll} style={{ cursor: 'pointer', fontSize: 16 }} />
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}><Card size="small"><Statistic title="成品库存" value={products.length} prefix={<AppstoreOutlined />} suffix="种" /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="纸板材料" value={materials.length} prefix={<InboxOutlined />} suffix="种" /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="刀模" value={knifeDies.length} prefix={<ToolOutlined />} suffix="套" /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="彩印版" value={colorPrints.length} prefix={<PictureOutlined />} suffix="版" /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="总库存量" value={totalStock} suffix="件" /></Card></Col>
        <Col span={4}><Card size="small">
          <Statistic
            title="低库存预警" value={lowStockProducts.length} suffix="种"
            valueStyle={{ color: lowStockProducts.length > 0 ? '#cf1322' : '#389e0d' }}
            prefix={lowStockProducts.length > 0 ? <WarningOutlined /> : undefined}
          />
        </Card></Col>
      </Row>

      <Tabs items={tabItems} />
    </div>
  );
}
