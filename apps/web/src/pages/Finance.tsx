import React, { useEffect, useState } from 'react';
import { Table, Input, Space, message } from 'antd';
import api from '../utils/axios';

export default function Finance() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/finance-records').then((r) => setData(r.data)).catch(() => message.error('加载失败')).finally(() => setLoading(false));
  }, []);

  const filtered = data.filter((f: any) =>
    !keyword || f.type?.includes(keyword) || f.remark?.includes(keyword)
  );

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 120, render: (v: number) => `¥${Number(v||0).toLocaleString('zh-CN',{minimumFractionDigits:2})}` },
    { title: '关联单号', dataIndex: 'ref_no', key: 'ref_no', width: 130, render: (v: string) => v || '-' },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    { title: '创建日期', dataIndex: 'created_at', key: 'created_at', width: 110, render: (v: string) => v?.split('T')[0] || v },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>财务管理</h2>
        <Space>
          <Input placeholder="搜索类型/备注" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 200 }} allowClear />
        </Space>
      </div>
      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 15 }} />
    </div>
  );
}
