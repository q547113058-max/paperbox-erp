import React from 'react';
import { Tag } from 'antd';
import { DocumentListPage, DocColumn, DocDetailField, mapName, fmtDate, statusTag } from '../components/DocumentListPage';

const STATUS_COLOR: Record<string, string> = {
  '待确认': 'default', '已确认': 'blue', '生产中': 'orange',
  '待发货': 'purple', '已完成': 'green', '已取消': 'red',
};

const AFTER_SALE_COLOR: Record<string, string> = {
  '待处理': 'orange', '处理中': 'blue', '已解决': 'green', '已关闭': 'default',
};

const columns: DocColumn[] = [
  { title: '订单号', dataIndex: 'order_no', width: 130 },
  { title: '客户', dataIndex: 'customer_id', width: 120, render: (_: any, r: any, __: number, map?: Record<string, any>) => {
    const m = (map as any)?.customerMap || {};
    return m[r.customer_id] || `#${r.customer_id}`;
  }},
  { title: '产品名称', dataIndex: 'print_name', width: 150 },
  { title: '规格', dataIndex: 'customer_size', width: 120 },
  { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' as const },
  { title: '金额', dataIndex: 'total_amount', width: 100, align: 'right' as const, render: (v: number) => v != null ? `¥${v.toFixed(2)}` : '-' },
  { title: '订单状态', dataIndex: 'status', width: 90, render: (s: string) => statusTag(STATUS_COLOR, s) },
  { title: '售后状态', dataIndex: 'after_sale_status', width: 90, render: (s: string) => statusTag(AFTER_SALE_COLOR, s || '待处理') },
  { title: '创建日期', dataIndex: 'created_at', width: 110, render: (v: string) => fmtDate(v) },
];

const detailFields: DocDetailField[] = [
  { label: '订单号', value: (r) => r.order_no || '-' },
  { label: '客户', value: (r, m) => mapName(m.customerMap as any || {}, r.customer_id) },
  { label: '产品名称', value: (r) => r.print_name || '-' },
  { label: '规格', value: (r) => r.customer_size || '-' },
  { label: '数量', value: (r) => r.quantity || '-' },
  { label: '金额', value: (r) => r.total_amount != null ? `¥${r.total_amount.toFixed(2)}` : '-' },
  { label: '订单状态', value: (r) => r.status || '-' },
  { label: '交期', value: (r) => fmtDate(r.delivery_date) },
  { label: '备注', value: (r) => r.remark || '-' },
];

export default function AfterSales() {
  return (
    <DocumentListPage
      endpoint="/orders"
      title="售后管理"
      columns={columns as any}
      searchFields={['order_no', 'print_name']}
      statusColorMap={AFTER_SALE_COLOR}
      detailTitle="售后详情"
      detailFields={detailFields}
      extraEndpoints={{ customerMap: '/customers' }}
    />
  );
}
