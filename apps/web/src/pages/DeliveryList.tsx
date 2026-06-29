import React from 'react';
import type { Delivery } from '../types/api';
import { DocumentListPage, DocColumn, DocDetailField, mapName, fmtDate, statusTag } from '../components/DocumentListPage';

const STATUS_COLOR: Record<string, string> = {
  '待发货': 'orange', '已发货': 'blue', '已签收': 'green', '已取消': 'red',
};

const columns: DocColumn[] = [
  { title: '发货单号', dataIndex: 'delivery_no', width: 130 },
  { title: '客户', dataIndex: 'customer_id', width: 120, render: (_: any, r: Delivery, __: number, map?: Record<string, any>) => {
    const m = (map as any)?.customerMap || {};
    return m[r.customer_id] || `#${r.customer_id}`;
  }},
  { title: '送货人', dataIndex: 'delivery_person', width: 100 },
  { title: '送货时间', dataIndex: 'delivery_time', width: 110, render: (v: string) => fmtDate(v) },
  { title: '签收', dataIndex: 'signed', width: 70, align: 'center', render: (v: number) => v ? '✓' : '✗' },
  { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => statusTag(STATUS_COLOR, s) },
  { title: '创建日期', dataIndex: 'created_at', width: 110, render: (v: string) => fmtDate(v) },
  { title: '备注', dataIndex: 'remark', ellipsis: true },
];

const detailFields: DocDetailField[] = [
  { label: '发货单号', value: (r) => r.delivery_no || '-' },
  { label: '客户', value: (r, m) => mapName(m.customerMap as any || {}, r.customer_id) },
  { label: '送货人', value: (r) => r.delivery_person || '-' },
  { label: '送货时间', value: (r) => fmtDate(r.delivery_time) },
  { label: '送货地址', value: (r) => r.address || '-' },
  { label: '是否签收', value: (r) => r.signed ? '已签收' : '未签收' },
  { label: '签收时间', value: (r) => fmtDate(r.signed_at) },
  { label: '状态', value: (r) => r.status || '-' },
  { label: '创建日期', value: (r) => fmtDate(r.created_at) },
  { label: '备注', value: (r) => r.remark || '-' },
];

const detailItemColumns = [
  { title: '序号', width: 50, render: (_: any, __: any, idx: number) => idx + 1 },
  { title: '产品ID', dataIndex: 'product_id', width: 70 },
  { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' as const },
  { title: '单价', dataIndex: 'unit_price', width: 90, align: 'right' as const, render: (v: number) => v != null ? `¥${v.toFixed(2)}` : '-' },
  { title: '备注', dataIndex: 'remark', ellipsis: true },
];

export default function DeliveryList() {
  return (
    <DocumentListPage
      endpoint="/deliveries"
      title="送货单列表"
      columns={columns as any}
      searchFields={['delivery_no', 'delivery_person', 'address']}
      statusColorMap={STATUS_COLOR}
      detailTitle="送货单详情"
      detailFields={detailFields}
      extraEndpoints={{ customerMap: '/customers' }}
      detailItemsEndpoint={(r) => r.delivery_no ? `/deliveries/by-no/${r.delivery_no}` : `/deliveries/${r.id}`}
      detailItemColumns={detailItemColumns}
    />
  );
}
