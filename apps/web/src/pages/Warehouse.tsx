import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Tag, message } from 'antd';
import type { WarehouseEntry } from '../types/api';
import api from '../utils/axios';

const STATUS_COLOR: Record<string, string> = {
  '待发货': 'orange', '已发货': 'blue', '已收货': 'green', '已取消': 'red',
};

export default function Warehouse() {
  const [data, setData] = useState<WarehouseEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/warehouse-entries').then((r) => setData(r.data)).catch(() => message.error('加载失败')).finally(() => setLoading(false));
  }, []);

  const filtered = data.filter((w) =>
    !keyword || w.entry_no?.includes(keyword) || w.product_name?.includes(keyword) || String(w.order_id).includes(keyword)
  );

  const columns = [
    { title: '入库单号', dataIndex: 'entry_no', key: 'entry_no', width: 130, render: (v: string) => v || '-' },
    { title: '产品名称', dataIndex: 'product_name', key: 'product_name', width: 150 },
    { title: '订单ID', dataIndex: 'order_id', key: 'order_id', width: 80 },
    { title: '工单ID', dataIndex: 'work_order_id', key: 'work_order_id', width: 80 },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 90 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (s: string) => <Tag color={STATUS_COLOR[s] || 'default'}>{s}</Tag> },
    { title: '创建日期', dataIndex: 'created_at', key: 'created_at', width: 110, render: (v: string) => v?.split('T')[0] || v },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>仓库入库</h2>
        <Space>
          <Input placeholder="搜索单号/产品/订单" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 200 }} allowClear />
        </Space>
      </div>
      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 15 }} />
    </div>
  );
}
