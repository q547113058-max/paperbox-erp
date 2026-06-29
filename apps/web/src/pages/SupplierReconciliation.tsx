import React, { useEffect, useState, useMemo } from 'react';
import { Table, Input, Button, Space, message, Modal, Tag, Descriptions, Card, Statistic, Row, Col } from 'antd';
import { ReloadOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import type { Purchase, PurchaseItem } from '../types/api';
import api from '../utils/axios';
import { fmtDate, statusTag, mapName } from '../components/DocumentListPage';

const STATUS_COLOR: Record<string, string> = {
  '待审批': 'orange', '已审批': 'blue', '已驳回': 'red',
  '已入库': 'green', '已取消': 'default', '已出单': 'cyan',
};

export default function SupplierReconciliation() {
  const [data, setData] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [supplierMap, setSupplierMap] = useState<Record<number, string>>({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<Purchase | null>(null);
  const [detailItems, setDetailItems] = useState<PurchaseItem[]>([]);

  const fetchData = () => {
    setLoading(true);
    api.get('/purchases')
      .then((r) => setData(r.data || []))
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      const m: Record<number, string> = {};
      (res.data || []).forEach((s: any) => { m[s.id] = s.name || `供应商#${s.id}`; });
      setSupplierMap(m);
    } catch {}
  };

  useEffect(() => { fetchData(); fetchSuppliers(); }, []);

  const filtered = useMemo(() => {
    if (!keyword) return data;
    const kw = keyword.toLowerCase();
    return data.filter((p) => {
      const sName = supplierMap[p.supplier_id] || '';
      return (p.purchase_no || '').toLowerCase().includes(kw)
        || sName.toLowerCase().includes(kw)
        || (p.ref_type || '').toLowerCase().includes(kw);
    });
  }, [data, keyword, supplierMap]);

  const stats = useMemo(() => {
    const total = data.reduce((s, p) => s + (p.total_amount || 0), 0);
    const pending = data.filter(p => p.status === '待审批').length;
    const done = data.filter(p => p.status === '已入库').length;
    return { total, pending, done, count: data.length };
  }, [data]);

  const openDetail = async (r: Purchase) => {
    setDetail(r);
    setDetailOpen(true);
    try {
      const res = await api.get(`/purchases/${r.id}/items`);
      setDetailItems(res.data || []);
    } catch {
      setDetailItems([]);
    }
  };

  const columns = [
    { title: '采购单号', dataIndex: 'purchase_no', width: 140 },
    {
      title: '供应商', dataIndex: 'supplier_id', width: 140,
      render: (id: number) => supplierMap[id] || `#${id}`,
    },
    { title: '来源类型', dataIndex: 'ref_type', width: 100 },
    { title: '金额', dataIndex: 'total_amount', width: 120, align: 'right' as const,
      render: (v: number) => v != null ? `¥${v.toFixed(2)}` : '-' },
    { title: '交期', dataIndex: 'delivery_date', width: 110, render: (v: string) => fmtDate(v) },
    { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => statusTag(STATUS_COLOR, s) },
    { title: '创建日期', dataIndex: 'created_at', width: 110, render: (v: string) => fmtDate(v) },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    {
      title: '操作', key: 'action', width: 80, fixed: 'right' as const,
      render: (_: any, r: Purchase) => (
        <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>供应商对账单</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small"><Statistic title="采购单总数" value={stats.count} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="待审批" value={stats.pending} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="已入库" value={stats.done} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="总金额" value={stats.total} precision={2} prefix="¥" /></Card>
        </Col>
      </Row>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="搜索单号 / 供应商名"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            style={{ width: 260 }}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
        </Space>
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1100 }}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        size="middle"
      />

      <Modal
        title={`采购单详情 - ${detail?.purchase_no || ''}`}
        open={detailOpen}
        onCancel={() => { setDetailOpen(false); setDetail(null); }}
        footer={null}
        width={700}
        destroyOnClose
      >
        {detail && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="采购单号">{detail.purchase_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="供应商">{supplierMap[detail.supplier_id] || `#${detail.supplier_id}`}</Descriptions.Item>
              <Descriptions.Item label="金额">¥{(detail.total_amount || 0).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="交期">{fmtDate(detail.delivery_date)}</Descriptions.Item>
              <Descriptions.Item label="来源类型">{detail.ref_type || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">{detail.status || '-'}</Descriptions.Item>
              <Descriptions.Item label="送货地址">{detail.delivery_address || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建日期">{fmtDate(detail.created_at)}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{detail.remark || '-'}</Descriptions.Item>
            </Descriptions>
            {detailItems.length > 0 && (
              <>
                <h4 style={{ margin: '8px 0' }}>采购明细</h4>
                <Table
                  dataSource={detailItems}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '物料名称', dataIndex: 'material_name', width: 150 },
                    { title: '规格', dataIndex: 'spec', width: 120 },
                    { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' },
                    { title: '单价', dataIndex: 'unit_price', width: 100, align: 'right', render: (v: number) => `¥${(v || 0).toFixed(2)}` },
                    { title: '金额', dataIndex: 'amount', width: 120, align: 'right', render: (v: number) => `¥${(v || 0).toFixed(2)}` },
                    { title: '纸种', dataIndex: 'paper_type', width: 80 },
                  ]}
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
