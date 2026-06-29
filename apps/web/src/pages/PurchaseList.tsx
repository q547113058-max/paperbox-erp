import React from 'react';
import { Tag } from 'antd';
import type { Purchase } from '../types/api';
import { DocumentListPage, DocColumn, DocDetailField, mapName, fmtDate, statusTag } from '../components/DocumentListPage';

const STATUS_COLOR: Record<string, string> = {
  '待审批': 'orange', '已审批': 'blue', '已驳回': 'red',
  '已入库': 'green', '已取消': 'default', '已出单': 'cyan',
};

const columns: DocColumn[] = [
  { title: '采购单号', dataIndex: 'purchase_no', width: 130 },
  { title: '供应商', dataIndex: 'supplier_id', width: 120, render: (_: any, r: Purchase, __: number, map?: Record<string, any>) => {
    const m = (map as any)?.supplierMap || {};
    return m[r.supplier_id] || `#${r.supplier_id}`;
  }},
  { title: '金额', dataIndex: 'total_amount', width: 100, align: 'right', render: (v: number) => v != null ? `¥${v.toFixed(2)}` : '-' },
  { title: '交期', dataIndex: 'delivery_date', width: 100, render: (v: string) => fmtDate(v) },
  { title: '来源类型', dataIndex: 'ref_type', width: 100 },
  { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => statusTag(STATUS_COLOR, s) },
  { title: '送货地址', dataIndex: 'delivery_address', width: 150, ellipsis: true },
  { title: '创建日期', dataIndex: 'created_at', width: 110, render: (v: string) => fmtDate(v) },
  { title: '备注', dataIndex: 'remark', ellipsis: true },
];

const detailFields: DocDetailField[] = [
  { label: '采购单号', value: (r) => r.purchase_no || '-' },
  { label: '供应商', value: (r, m) => mapName(m.supplierMap as any || {}, r.supplier_id) },
  { label: '金额', value: (r) => r.total_amount != null ? `¥${r.total_amount.toFixed(2)}` : '-' },
  { label: '交期', value: (r) => fmtDate(r.delivery_date) },
  { label: '来源类型', value: (r) => r.ref_type || '-' },
  { label: '状态', value: (r) => r.status || '-' },
  { label: '送货地址', value: (r) => r.delivery_address || '-' },
  { label: '创建日期', value: (r) => fmtDate(r.created_at) },
  { label: '备注', value: (r) => r.remark || '-' },
];

const detailItemColumns = [
  { title: '序号', width: 50, render: (_: any, __: any, idx: number) => idx + 1 },
  { title: '材料名称', dataIndex: 'material_name', width: 130 },
  { title: '规格', dataIndex: 'spec', width: 100 },
  { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' as const },
  { title: '单价', dataIndex: 'unit_price', width: 90, align: 'right' as const, render: (v: number) => v != null ? `¥${v.toFixed(2)}` : '-' },
  { title: '金额', dataIndex: 'amount', width: 100, align: 'right' as const, render: (v: number) => v != null ? `¥${v.toFixed(2)}` : '-' },
  { title: '纸板类型', dataIndex: 'paper_type', width: 90 },
  { title: '单位', dataIndex: 'unit', width: 60 },
  { title: '送货地址', dataIndex: 'delivery_address', width: 120, ellipsis: true },
];

export default function PurchaseList() {
  return (
    <DocumentListPage
      endpoint="/purchases"
      title="采购单列表"
      columns={columns as any}
      searchFields={['purchase_no', 'ref_type', 'delivery_address']}
      statusColorMap={STATUS_COLOR}
      detailTitle="采购单详情"
      detailFields={detailFields}
      extraEndpoints={{ supplierMap: '/suppliers' }}
      detailItemsEndpoint={(r) => `/purchases/${r.id}/items`}
      detailItemColumns={detailItemColumns}
    />
  );
}
