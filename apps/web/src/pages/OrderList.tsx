import React from 'react';
import { DocumentListPage, DocColumn, DocDetailField, mapName, fmtDate } from '../components/DocumentListPage';

/** 订单明细扁平数据（由后端 /orders/items 返回） */
interface OrderItemRow {
  id: number;
  order_id: number;
  order_no: string;
  order_date: string;
  customer_id: number | null;
  customer_name: string;
  product_id: number;
  product_name: string;
  product_spec: string;
  quantity: number;
  delivered_qty: number;
  undelivered_qty: number;
  unit_price: number;
  amount: number;
  delivery_date: string;
  remark: string;
}

const columns: DocColumn[] = [
  {
    title: '序号', key: 'idx', width: 60, align: 'center',
    render: (_: any, __: any, idx: number) => idx + 1,
  },
  {
    title: '订单日期', dataIndex: 'order_date', width: 110,
    render: (v: string) => fmtDate(v),
  },
  { title: '客户名称', dataIndex: 'customer_name', width: 140 },
  { title: '产品名称', dataIndex: 'product_name', width: 140 },
  { title: '产品规格', dataIndex: 'product_spec', width: 120 },
  {
    title: '订单数量', dataIndex: 'quantity', width: 90, align: 'right',
    render: (v: number) => v != null ? v.toLocaleString() : '-',
  },
  {
    title: '已发货数量', dataIndex: 'delivered_qty', width: 100, align: 'right',
    render: (v: number) => v != null ? v.toLocaleString() : '-',
  },
  {
    title: '未发货数量', dataIndex: 'undelivered_qty', width: 100, align: 'right',
    render: (v: number) => v != null ? v.toLocaleString() : '-',
  },
  {
    title: '单价', dataIndex: 'unit_price', width: 90, align: 'right',
    render: (v: number) => v != null ? `¥${v.toFixed(2)}` : '-',
  },
  {
    title: '金额', dataIndex: 'amount', width: 100, align: 'right',
    render: (v: number) => v != null ? `¥${v.toFixed(2)}` : '-',
  },
  {
    title: '交货日期', dataIndex: 'delivery_date', width: 110,
    render: (v: string) => fmtDate(v),
  },
  { title: '备注', dataIndex: 'remark', ellipsis: true },
];

const detailFields: DocDetailField[] = [
  { label: '订单号', value: (r: OrderItemRow) => r.order_no || '-' },
  { label: '订单日期', value: (r: OrderItemRow) => fmtDate(r.order_date) },
  { label: '客户名称', value: (r: OrderItemRow) => r.customer_name || '-' },
  { label: '产品名称', value: (r: OrderItemRow) => r.product_name || '-' },
  { label: '产品规格', value: (r: OrderItemRow) => r.product_spec || '-' },
  { label: '订单数量', value: (r: OrderItemRow) => r.quantity != null ? r.quantity.toLocaleString() : '-' },
  { label: '已发货数量', value: (r: OrderItemRow) => r.delivered_qty != null ? r.delivered_qty.toLocaleString() : '-' },
  { label: '未发货数量', value: (r: OrderItemRow) => r.undelivered_qty != null ? r.undelivered_qty.toLocaleString() : '-' },
  { label: '单价', value: (r: OrderItemRow) => r.unit_price != null ? `¥${r.unit_price.toFixed(2)}` : '-' },
  { label: '金额', value: (r: OrderItemRow) => r.amount != null ? `¥${r.amount.toFixed(2)}` : '-' },
  { label: '交货日期', value: (r: OrderItemRow) => fmtDate(r.delivery_date) },
  { label: '备注', value: (r: OrderItemRow) => r.remark || '-' },
];

export default function OrderList() {
  return (
    <DocumentListPage
      endpoint="/orders/items"
      title="销售订单列表"
      columns={columns as any}
      searchFields={['customer_name', 'product_name', 'product_spec', 'order_no', 'remark']}
      detailTitle="订单明细详情"
      detailFields={detailFields}
    />
  );
}
