import React from 'react';
import type { WarehouseEntry } from '../types/api';
import { DocumentListPage, DocColumn, DocDetailField, mapName, fmtDate, statusTag } from '../components/DocumentListPage';

const STATUS_COLOR: Record<string, string> = {
  '待发货': 'orange', '已发货': 'blue', '已收货': 'green', '已取消': 'red',
};

const columns: DocColumn[] = [
  { title: '入库单号', dataIndex: 'entry_no', width: 130 },
  { title: '产品名称', dataIndex: 'product_name', width: 150 },
  { title: '订单号', dataIndex: 'order_id', width: 120, render: (_: any, r: WarehouseEntry, __: number, map?: Record<string, any>) => {
    const m = (map as any)?.orderMap || {};
    return m[r.order_id] || `#${r.order_id}`;
  }},
  { title: '工单号', dataIndex: 'work_order_id', width: 120, render: (_: any, r: WarehouseEntry, __: number, map?: Record<string, any>) => {
    const m = (map as any)?.workOrderMap || {};
    return r.work_order_id ? (m[r.work_order_id] || `#${r.work_order_id}`) : '-';
  }},
  { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' },
  { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => statusTag(STATUS_COLOR, s) },
  { title: '创建日期', dataIndex: 'created_at', width: 110, render: (v: string) => fmtDate(v) },
  { title: '备注', dataIndex: 'remark', ellipsis: true },
];

const detailFields: DocDetailField[] = [
  { label: '入库单号', value: (r) => r.entry_no || '-' },
  { label: '产品名称', value: (r) => r.product_name || '-' },
  { label: '订单号', value: (r, m) => mapName(m.orderMap as any || {}, r.order_id) },
  { label: '工单号', value: (r, m) => r.work_order_id ? mapName(m.workOrderMap as any || {}, r.work_order_id) : '-' },
  { label: '数量', value: (r) => r.quantity ?? '-' },
  { label: '状态', value: (r) => r.status || '-' },
  { label: '创建日期', value: (r) => fmtDate(r.created_at) },
  { label: '备注', value: (r) => r.remark || '-' },
];

export default function WarehouseReceiptList() {
  return (
    <DocumentListPage
      endpoint="/warehouse-entries"
      title="进仓单列表"
      columns={columns as any}
      searchFields={['entry_no', 'product_name']}
      statusColorMap={STATUS_COLOR}
      detailTitle="进仓单详情"
      detailFields={detailFields}
      extraEndpoints={{ orderMap: '/orders', workOrderMap: '/work_orders' }}
    />
  );
}
