import React, { useMemo } from 'react';
import { Table, Select, InputNumber, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export interface InlineItemEditorColumn<T> {
  key: string;
  title: string;
  dataIndex?: string;
  width?: number;
  align?: 'left' | 'right' | 'center';
  fixed?: 'left' | 'right';
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

export interface InlineItemEditorProps<T extends { key: string }> {
  /** Title shown in the blue toolbar */
  toolbarTitle?: string;
  /** Product/item search select */
  searchValue: number | null;
  onSearchChange: (value: number | null) => void;
  searchOptions: { value: number; label: string }[];
  searchPlaceholder?: string;
  /** Quantity input */
  quantityLabel?: string;
  quantityValue: number;
  onQuantityChange: (value: number) => void;
  /** Price input (optional) */
  priceLabel?: string;
  priceValue?: number;
  onPriceChange?: (value: number) => void;
  /** Add button */
  addButtonText?: string;
  onAddItem: () => void;
  addDisabled?: boolean;
  /** Table props */
  items: T[];
  columns: InlineItemEditorColumn<T>[];
  rowKey?: string;
  scrollX?: number;
  scrollY?: number;
  emptyText?: string;
  /** Summary row renderer */
  renderSummary?: (items: T[]) => React.ReactNode;
  /** Extra content after toolbar but before table */
  extra?: React.ReactNode;
}

export function InlineItemEditor<T extends { key: string }>({
  toolbarTitle = '添加明细',
  searchValue,
  onSearchChange,
  searchOptions,
  searchPlaceholder = '搜索物料...',
  quantityLabel = '数量',
  quantityValue,
  onQuantityChange,
  priceLabel,
  priceValue,
  onPriceChange,
  addButtonText = '添加',
  onAddItem,
  addDisabled = false,
  items,
  columns,
  rowKey = 'key',
  scrollX = 1400,
  scrollY = 400,
  emptyText = '暂无明细',
  renderSummary,
  extra,
}: InlineItemEditorProps<T>) {
  const tableColumns = useMemo(() =>
    columns.map(col => ({
      title: col.title,
      dataIndex: col.dataIndex,
      width: col.width,
      align: col.align,
      fixed: col.fixed,
      render: col.render,
    })),
  [columns]);

  return (
    <>
      {/* Toolbar */}
      <div style={{
        background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 6,
        padding: '8px 16px', marginBottom: 12, display: 'flex',
        alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0050b3', whiteSpace: 'nowrap' }}>
          {toolbarTitle}
        </span>
        <Select
          showSearch
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          style={{ minWidth: 320, flex: 1 }}
          optionFilterProp="label"
          options={searchOptions}
          allowClear
          notFoundContent="未找到匹配项"
        />
        <span style={{ fontSize: 13, color: '#595959' }}>{quantityLabel}</span>
        <InputNumber min={1} value={quantityValue} onChange={v => onQuantityChange(v || 1)} style={{ width: 80 }} />
        {priceLabel && onPriceChange && (
          <>
            <span style={{ fontSize: 13, color: '#595959' }}>{priceLabel}</span>
            <InputNumber min={0} step={0.01} value={priceValue ?? 0} onChange={v => onPriceChange(v || 0)} style={{ width: 100 }} />
          </>
        )}
        <Button type="primary" onClick={onAddItem} icon={<PlusOutlined />} disabled={addDisabled}>
          {addButtonText}
        </Button>
      </div>

      {extra}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Table
          rowKey={rowKey}
          size="small"
          columns={tableColumns as any}
          dataSource={items}
          pagination={false}
          scroll={{ x: scrollX, y: scrollY }}
          locale={{ emptyText }}
          summary={renderSummary ? () => renderSummary(items) : undefined}
        />
      </div>
    </>
  );
}
