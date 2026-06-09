import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Tag, message } from 'antd';
import type { Delivery } from '../types/api';
import api from '../utils/axios';

const STATUS_COLOR: Record<string, string> = {
  '待发货': 'orange', '已发货': 'blue', '已收货': 'green', '已取消': 'red',
};

export default function Deliveries() {
  const [data, setData] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/deliveries').then((r) => setData(r.data)).catch(() => message.error('加载失败')).finally(() => setLoading(false));
  }, []);

  const filtered = data.filter((d) => !keyword || String(d.order_id).includes(keyword));

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '订单ID', dataIndex: 'order_id', key: 'order_id', width: 90 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => <Tag color={STATUS_COLOR[s] || 'default'}>{s}</Tag> },
    { title: '交货日期', dataIndex: 'delivery_date', key: 'delivery_date', width: 110 },
    { title: '创建日期', dataIndex: 'created_at', key: 'created_at', width: 110, render: (v: string) => v?.split('T')[0] || v },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>发货管理</h2>
        <Space>
          <Input placeholder="搜索订单ID" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 200 }} allowClear />
        </Space>
      </div>
      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 15 }} />
    </div>
  );
}
