import React, { useEffect, useState, useMemo } from 'react';
import { Table, Input, Button, Space, message, Modal, Tag, Descriptions } from 'antd';
import { ReloadOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../utils/axios';

/** 列定义 */
export interface DocColumn {
  title: string;
  dataIndex: string;
  key?: string;
  width?: number;
  align?: 'left' | 'right' | 'center';
  render?: (value: any, record: any, index: number, mapData: Record<string, any>) => React.ReactNode;
  ellipsis?: boolean;
  fixed?: 'left' | 'right';
}

/** 详情字段定义 */
export interface DocDetailField {
  label: string;
  value: (record: any, mapData: Record<string, any>) => React.ReactNode | string;
}

interface DocumentListPageProps {
  /** API 端点 */
  endpoint: string;
  /** 页面标题 */
  title: string;
  /** 表格列定义 */
  columns: DocColumn[];
  /** 搜索匹配字段 */
  searchFields?: string[];
  /** 状态颜色映射 */
  statusColorMap?: Record<string, string>;
  /** 按钮文字 */
  buttonLabel?: string;
  /** 详情标题字段 */
  detailTitle?: string;
  /** 详情字段 */
  detailFields?: DocDetailField[];
  /** 额外在加载时获取的辅助数据 */
  extraEndpoints?: Record<string, string>;
  /** 获取明细的端点函数，返回 items 列表 */
  detailItemsEndpoint?: (record: any) => string | null;
  /** 明细表格列定义 */
  detailItemColumns?: { title: string; dataIndex?: string; width?: number; align?: 'left' | 'right' | 'center'; render?: (v: any, r: any, idx: number) => React.ReactNode }[];
}

export const DocumentListPage: React.FC<DocumentListPageProps> = ({
  endpoint,
  title,
  columns,
  searchFields = [],
  statusColorMap = {},
  detailTitle = '详情',
  detailFields = [],
  extraEndpoints = {},
  detailItemsEndpoint,
  detailItemColumns = [],
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [mapData, setMapData] = useState<Record<string, any>>({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [detailItems, setDetailItems] = useState<any[]>([]);
  const [detailItemsLoading, setDetailItemsLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api.get(endpoint)
      .then((r) => setData(r.data || []))
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  const fetchExtra = async () => {
    const newMap: Record<string, any> = {};
    for (const [key, ep] of Object.entries(extraEndpoints)) {
      try {
        const res = await api.get(ep);
        newMap[key] = res.data || [];
      } catch {
        newMap[key] = [];
      }
    }
    setMapData(newMap);
  };

  useEffect(() => {
    fetchData();
    if (Object.keys(extraEndpoints).length > 0) fetchExtra();
  }, []);

  const filtered = useMemo(() => {
    if (!keyword) return data;
    const kw = keyword.toLowerCase();
    return data.filter((item) => {
      for (const field of searchFields) {
        const val = item[field];
        if (val != null && String(val).toLowerCase().includes(kw)) return true;
      }
      return false;
    });
  }, [data, keyword, searchFields]);

  const openDetail = async (record: any) => {
    setDetail(record);
    setDetailOpen(true);
    setDetailItems([]);
    if (detailItemsEndpoint) {
      const ep = detailItemsEndpoint(record);
      if (ep) {
        setDetailItemsLoading(true);
        try {
          const res = await api.get(ep);
          setDetailItems(res.data?.items || res.data || []);
        } catch { setDetailItems([]); }
        setDetailItemsLoading(false);
      }
    }
  };

  const fullColumns: any[] = [
    ...columns.map((col) => {
      const origRender = col.render;
      return {
        ...col,
        render: origRender
          ? (value: any, record: any, index: number) => (origRender as any)(value, record, index, mapData)
          : (v: any) => v != null ? String(v) : '-',
      };
    }),
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, r: any) => (
        <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => openDetail(r)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* 标题栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h2>
        <Space>
          <Input
            placeholder={`搜索 ${searchFields.join(' / ')}`}
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            style={{ width: 280 }}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            刷新
          </Button>
        </Space>
      </div>

      {/* 表格 */}
      <Table
        dataSource={filtered}
        columns={fullColumns}
        rowKey="id"
        loading={loading}
        scroll={{ x: columns.reduce((sum, c) => sum + (c.width || 120), 160) }}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        size="middle"
      />

      {/* 详情弹窗 */}
      <Modal
        title={detailTitle}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={detailItemColumns.length > 0 ? 900 : 640}
      >
        {detail && (
          <>
            <Descriptions column={2} bordered size="small">
              {detailFields.map((f) => (
                <Descriptions.Item key={f.label} label={f.label}>
                  {typeof f.value === 'function' ? f.value(detail, mapData) : f.value}
                </Descriptions.Item>
              ))}
            </Descriptions>
            {detailItemColumns.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ marginBottom: 8, fontSize: 14, color: '#1e40af' }}>明细</h4>
                <Table
                  rowKey="id"
                  size="small"
                  loading={detailItemsLoading}
                  dataSource={detailItems}
                  columns={detailItemColumns.map(c => ({
                    ...c,
                    render: c.render || ((v: any) => v != null ? String(v) : '-'),
                  }))}
                  pagination={detailItems.length > 10 ? { pageSize: 10, size: 'small' } : false}
                />
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

/** 辅助函数：根据 map 查找名称 */
export function mapName(map: Record<number, string>, id: number | null | undefined, fallback?: string): string {
  if (id == null) return fallback || '-';
  return map[id] || fallback || `#${id}`;
}

/** 辅助函数：渲染日期 */
export function fmtDate(v: string | null | undefined): string {
  if (!v) return '-';
  return v.split('T')[0] || v;
}

/** 辅助函数：状态标签 */
export function statusTag(statusColorMap: Record<string, string>, s: string): React.ReactNode {
  return <Tag color={statusColorMap[s] || 'default'}>{s}</Tag>;
}
