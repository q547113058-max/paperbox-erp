import React from 'react';
import type { OutsourcingOrder } from '../types/api';
import { DocumentListPage, DocColumn, DocDetailField, mapName, fmtDate, statusTag } from '../components/DocumentListPage';

const STATUS_COLOR: Record<string, string> = {
  '待加工': 'orange', '已完成': 'green', '已取消': 'red',
};

const columns: DocColumn[] = [
  { title: '委外单号', dataIndex: 'order_no', width: 130 },
  { title: '物料名称', dataIndex: 'material_name', width: 150 },
  { title: '规格', dataIndex: 'material_spec', width: 120 },
  { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' },
  { title: '供应商', dataIndex: 'supplier_id', width: 120, render: (_: any, r: OutsourcingOrder, __: number, map?: Record<string, any>) => {
    const m = (map as any)?.supplierMap || {};
    return m[r.supplier_id] || `#${r.supplier_id}`;
  }},
  { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => statusTag(STATUS_COLOR, s) },
  { title: '计划日期', dataIndex: 'planned_date', width: 110, render: (v: string) => fmtDate(v) },
  { title: '已完成数量', dataIndex: 'received_qty', width: 100, align: 'right' },
  { title: '创建日期', dataIndex: 'created_at', width: 110, render: (v: string) => fmtDate(v) },
  { title: '备注', dataIndex: 'remark', ellipsis: true },
];

const detailFields: DocDetailField[] = [
  { label: '委外单号', value: (r) => r.order_no || '-' },
  { label: '物料名称', value: (r) => r.material_name || '-' },
  { label: '规格', value: (r) => r.material_spec || '-' },
  { label: '数量', value: (r) => r.quantity || '-' },
  { label: '供应商', value: (r, m) => mapName(m.supplierMap as any || {}, r.supplier_id) },
  { label: '状态', value: (r) => r.status || '-' },
  { label: '计划日期', value: (r) => fmtDate(r.planned_date) },
  { label: '已完成数量', value: (r) => r.received_qty ?? '-' },
  { label: '完成日期', value: (r) => fmtDate(r.completed_date) },
  { label: '创建日期', value: (r) => fmtDate(r.created_at) },
  { label: '备注', value: (r) => r.remark || '-' },
];

export default function OutsourcingOrderList() {
  return (
    <DocumentListPage
      endpoint="/outsourcing_orders"
      title="委外单列表"
      columns={columns as any}
      searchFields={['order_no', 'material_name', 'material_spec']}
      statusColorMap={STATUS_COLOR}
      detailTitle="委外单详情"
      detailFields={detailFields}
      extraEndpoints={{ supplierMap: '/suppliers' }}
    />
  );
}
