import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Tag, message } from 'antd';
import type { Purchase } from '../types/api';
import api from '../utils/axios';

const STATUS_COLOR: Record<string, string> = {
  '待审批': 'orange', '已审批': 'blue', '已入库': 'green', '已取消': 'red',
};

export default function Purchases() {
  const [data, setData] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/purchases').then((r) => setData(r.data)).catch(() => message.error('加载失败')).finally(() => setLoading(false));
  }, []);

  const filtered = data.filter((p) => !keyword || p.purchase_no?.includes(keyword) || String(p.supplier_id).includes(keyword));

  const columns = [
    { title: '采购单号', dataIndex: 'purchase_no', key: 'purchase_no', width: 130, render: (v: string) => v || '-' },
    { title: '供应商ID', dataIndex: 'supplier_id', key: 'supplier_id', width: 90 },
    { title: '关联类型', dataIndex: 'ref_type', key: 'ref_type', width: 100 },
    { title: '关联ID', dataIndex: 'ref_id', key: 'ref_id', width: 80 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (s: string) => <Tag color={STATUS_COLOR[s] || 'default'}>{s}</Tag> },
    { title: '总金额', dataIndex: 'total_amount', key: 'total_amount', width: 110, render: (v: number) => `¥${Number(v||0).toLocaleString('zh-CN',{minimumFractionDigits:2})}` },
    { title: '交货日期', dataIndex: 'delivery_date', key: 'delivery_date', width: 110 },
    { title: '创建日期', dataIndex: 'created_at', key: 'created_at', width: 110, render: (v: string) => v?.split('T')[0] || v },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>采购管理</h2>
        <Space>
          <Input placeholder="搜索单号/供应商" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 200 }} allowClear />
        </Space>
      </div>
      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 15 }} />
    </div>
  );
}
