import React from 'react';
import { Tag } from 'antd';
import type { Order } from '../types/api';
import { DocumentListPage, DocColumn, DocDetailField, mapName, fmtDate, statusTag } from '../components/DocumentListPage';
import { getStatusColor } from '../utils/statusColor';

const STATUS_COLOR: Record<string, string> = {
  '待确认': 'default', '已确认': 'blue', '生产中': 'orange',
  '待发货': 'purple', '已完成': 'green', '已取消': 'red',
};

const columns: DocColumn[] = [
  { title: '订单号', dataIndex: 'order_no', width: 130 },
  { title: '客户', dataIndex: 'customer_id', width: 120, render: (_: any, r: Order, __: number, map?: Record<string, any>) => {
    const m = (map as any)?.customerMap || {};
    return m[r.customer_id] || `#${r.customer_id}`;
  }},
  { title: '金额', dataIndex: 'total_amount', width: 100, align: 'right', render: (v: number) => v != null ? `¥${v.toFixed(2)}` : '-' },
  { title: '交期', dataIndex: 'delivery_date', width: 100, render: (v: string) => fmtDate(v) },
  { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => statusTag(STATUS_COLOR, s) },
  { title: '下单日期', dataIndex: 'order_date', width: 110, render: (v: string) => fmtDate(v) },
  { title: '备注', dataIndex: 'remark', ellipsis: true },
];

const detailFields: DocDetailField[] = [
  { label: '订单号', value: (r) => r.order_no || '-' },
  { label: '客户', value: (r, m) => mapName(m.customerMap as any || {}, r.customer_id) },
  { label: '金额', value: (r) => r.total_amount != null ? `¥${r.total_amount.toFixed(2)}` : '-' },
  { label: '成本', value: (r) => r.total_cost != null ? `¥${r.total_cost.toFixed(2)}` : '-' },
  { label: '利润', value: (r) => r.profit != null ? `¥${r.profit.toFixed(2)}` : '-' },
  { label: '交期', value: (r) => fmtDate(r.delivery_date) },
  { label: '状态', value: (r) => r.status || '-' },
  { label: '下单日期', value: (r) => fmtDate(r.order_date) },
  { label: '备注', value: (r) => r.remark || '-' },
];

const detailItemColumns = [
  { title: '序号', width: 50, render: (_: any, __: any, idx: number) => idx + 1 },
  { title: '产品ID', dataIndex: 'product_id', width: 70 },
  { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' as const },
  { title: '单价', dataIndex: 'unit_price', width: 90, align: 'right' as const, render: (v: number) => v != null ? `¥${v.toFixed(2)}` : '-' },
  { title: '金额', dataIndex: 'amount', width: 100, align: 'right' as const, render: (v: number) => v != null ? `¥${v.toFixed(2)}` : '-' },
  { title: '已发货', dataIndex: 'delivered_qty', width: 80, align: 'right' as const },
  { title: '下单日期', dataIndex: 'order_date', width: 100, render: (v: string) => fmtDate(v) },
  { title: '交期', dataIndex: 'delivery_date', width: 90, render: (v: string) => fmtDate(v) },
  { title: '客户编码', dataIndex: 'customer_product_code', width: 90, render: (v: string) => v || '-' },
  { title: '备注', dataIndex: 'remark', ellipsis: true },
];

export default function OrderList() {
  return (
    <DocumentListPage
      endpoint="/orders"
      title="销售订单列表"
      columns={columns as any}
      searchFields={['order_no', 'customer_order_no']}
      statusColorMap={STATUS_COLOR}
      detailTitle="销售订单详情"
      detailFields={detailFields}
      extraEndpoints={{ customerMap: '/customers' }}
      detailItemsEndpoint={(r) => `/orders/${r.id}`}
      detailItemColumns={detailItemColumns}
    />
  );
}
