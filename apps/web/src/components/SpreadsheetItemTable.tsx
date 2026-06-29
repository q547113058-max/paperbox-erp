import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input, InputNumber, Select, Button, Table, Tag } from 'antd';
import { DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import type { Product } from '../types/api';

// ── Types ──────────────────────────────────────────────────

export interface SpreadsheetColumn {
  key: string;
  title: string;
  width?: number;
  type: 'text' | 'number' | 'select' | 'auto' | 'product';
  options?: { value: any; label: string }[];
  editable?: boolean;       // default true, auto ignores this
  fixed?: 'left' | 'right';
  align?: 'left' | 'right' | 'center';
  placeholder?: string;
  onCellChange?: (value: any, record: any) => Partial<Record<string, any>>; // side effects
}

export interface SpreadsheetItemTableProps {
  items: Record<string, any>[];
  columns: SpreadsheetColumn[];
  onChange: (items: Record<string, any>[]) => void;
  rowKey?: string;
  emptyRows?: number;
  totals?: { key: string; label: string; calc: (items: any[]) => number };
  products?: Product[];     // for product-type columns
  onSearchProduct?: (keyword: string) => void;
  productSearchResults?: Product[];
  onAddProduct?: (product: Product) => void;
}

// ── Inline Cell Editor ────────────────────────────────────

interface CellEditorProps {
  column: SpreadsheetColumn;
  value: any;
  record: any;
  products?: Product[];
  onCommit: (value: any, sideEffects?: Partial<Record<string, any>>) => void;
  onCancel: () => void;
}

const CellEditor: React.FC<CellEditorProps> = ({ column, value, record, products, onCommit, onCancel }) => {
  const inputRef = useRef<any>(null);

  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus?.();
        inputRef.current.select?.();
      }
    }, 50);
  }, []);

  const handleCommit = (v: any) => {
    const sideEffects: Record<string, any> = {};

    // Product selection auto-fills
    if (column.type === 'product' && v && products) {
      const p = products.find((p) => p.id === v);
      if (p) {
        sideEffects.product_name = p.name;
        sideEffects.spec = p.spec;
        sideEffects.unit_price = p.unit_price;
        sideEffects.unit = p.unit;
      }
    }

    // Quantity/unit price → amount trigger
    if (column.key === 'quantity' || column.key === 'unit_price') {
      const qty = column.key === 'quantity' ? Number(v) : Number(record.quantity || 0);
      const price = column.key === 'unit_price' ? Number(v) : Number(record.unit_price || 0);
      sideEffects.amount = parseFloat((qty * price).toFixed(2));
    }

    if (column.onCellChange) {
      Object.assign(sideEffects, column.onCellChange(v, record));
    }

    onCommit(v, sideEffects);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onCancel(); return; }
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      // commit and move handled by parent
      handleCommit(value);
    }
  };

  if (column.type === 'product') {
    return (
      <Select
        ref={inputRef}
        showSearch
        value={value || undefined}
        onChange={(v) => handleCommit(v)}
        onKeyDown={handleKeyDown}
        style={{ width: '100%' }}
        placeholder={column.placeholder || '选择产品'}
        optionFilterProp="label"
        filterOption={(input, option) => {
          const label = (option?.label as string || '').toLowerCase();
          const name = (option as any)?.productname || '';
          const code = (option as any)?.productcode || '';
          const kw = input.toLowerCase();
          return label.includes(kw) || name.includes(kw) || code.includes(kw);
        }}
        popupMatchSelectWidth={300}
        defaultOpen
        autoFocus
        options={(products || []).map((p) => ({
          value: p.id,
          label: `${p.name || p.code || ''} ${p.spec || ''}`.trim(),
          productname: p.name,
          productcode: p.code,
        }))}
      />
    );
  }

  if (column.type === 'select') {
    return (
      <Select
        ref={inputRef}
        value={value}
        onChange={(v) => handleCommit(v)}
        onKeyDown={handleKeyDown}
        style={{ width: '100%' }}
        options={column.options}
        defaultOpen
        autoFocus
      />
    );
  }

  if (column.type === 'number') {
    return (
      <InputNumber
        ref={inputRef}
        value={value}
        onChange={(v) => handleCommit(v)}
        onKeyDown={handleKeyDown}
        style={{ width: '100%' }}
        min={0}
        step={column.key === 'unit_price' ? 0.01 : 1}
        precision={column.key === 'unit_price' ? 2 : 0}
        controls={false}
      />
    );
  }

  // text default
  return (
    <Input
      ref={inputRef}
      value={value || ''}
      onChange={(e) => handleCommit(e.target.value)}
      onKeyDown={handleKeyDown}
      style={{ width: '100%' }}
      placeholder={column.placeholder}
    />
  );
};

// ── Main Component ────────────────────────────────────────

const SpreadsheetItemTable: React.FC<SpreadsheetItemTableProps> = ({
  items,
  columns,
  onChange,
  rowKey = '_key',
  emptyRows = 8,
  totals,
  products,
  onSearchProduct,
  productSearchResults,
  onAddProduct,
}) => {
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colKey: string; draftValue: any } | null>(null);
  const [activeRow, setActiveRow] = useState<number>(-1);

  // Ensure we have enough rows
  const displayItems = [...items];
  const emptyNeeded = Math.max(0, emptyRows - displayItems.length);
  for (let i = 0; i < emptyNeeded; i++) {
    displayItems.push({ [rowKey]: `__empty__${i}`, _isNew: true });
  }

  const handleCellClick = (rowIdx: number, col: SpreadsheetColumn) => {
    if (col.type === 'auto' || col.editable === false) return;
    setActiveRow(rowIdx);
    setEditingCell({
      rowIdx,
      colKey: col.key,
      draftValue: displayItems[rowIdx]?.[col.key] ?? '',
    });
  };

  const commitCellEdit = (value: any, sideEffects?: Partial<Record<string, any>>) => {
    if (!editingCell) return;
    const { rowIdx, colKey } = editingCell;
    const newItems = displayItems.map((item, idx) => {
      if (idx !== rowIdx) return item;
      const updated = { ...item, [colKey]: value, ...(sideEffects || {}) };
      // Recalc amount if qty/price changed
      if (colKey === 'quantity' || colKey === 'unit_price' || sideEffects?.[colKey] !== undefined) {
        const qty = Number(updated.quantity || 0);
        const price = Number(updated.unit_price || 0);
        updated.amount = parseFloat((qty * price).toFixed(2));
      }
      updated._modified = true;
      delete updated._isNew;
      return updated;
    }).filter((item) => {
      // Keep real items and new items with content; discard empty untouched
      if (item[rowKey] && String(item[rowKey]).startsWith('__empty__')) {
        return item._modified;
      }
      return true;
    });

    const clean = newItems.map(({ _modified, _isNew, [rowKey]: _, ...rest }) => rest);
    onChange(clean);
    setEditingCell(null);

    // Move to next cell
    const colIdx = columns.findIndex((c) => c.key === colKey);
    const nextCol = columns.slice(colIdx + 1).find((c) => c.type !== 'auto' && c.editable !== false);
    if (nextCol) {
      setTimeout(() => {
        setActiveRow(rowIdx);
        setEditingCell({ rowIdx, colKey: nextCol.key, draftValue: displayItems[rowIdx]?.[nextCol.key] ?? '' });
      }, 30);
    }
  };

  const handleDeleteRow = (rowIdx: number) => {
    const newItems = displayItems
      .filter((_, idx) => idx !== rowIdx)
      .filter((item) => !String(item[rowKey]).startsWith('__empty__'))
      .map(({ _modified, _isNew, [rowKey]: _, ...rest }) => rest);
    onChange(newItems);
  };

  // Build table columns
  const tableColumns: ColumnType<any>[] = [
    {
      title: '#',
      key: '__row',
      width: 40,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (_: any, __: any, idx: number) => (
        <span style={{
          color: idx === activeRow ? '#fff' : '#94a3b8',
          fontSize: 12,
          fontWeight: idx === activeRow ? 600 : 400,
          background: idx === activeRow ? '#1e40af' : 'transparent',
          borderRadius: 2,
          padding: '0 4px',
        }}>
          {idx + 1}
        </span>
      ),
    },
    ...columns.map((col): ColumnType<any> => {
      const isEditing = editingCell?.rowIdx !== undefined &&
        editingCell?.colKey === col.key &&
        displayItems[editingCell.rowIdx] !== undefined;
      const editingRecord = isEditing ? displayItems[editingCell.rowIdx] : null;

      return {
        title: col.title,
        dataIndex: col.key,
        key: col.key,
        width: col.width,
        fixed: col.fixed,
        align: col.align || 'left',
        onCell: (record: any, idx?: number) => ({
          onClick: () => {
            if (idx !== undefined) handleCellClick(idx, col);
          },
          style: {
            cursor: col.type === 'auto' || col.editable === false ? 'default' : 'cell',
            padding: '2px 8px',
            background: idx !== undefined && idx === activeRow
              ? (col.type === 'auto' ? '#e8f0fe' : '#dbeafe')
              : undefined,
          },
        }),
        render: (value: any, record: any, idx: number) => {
          // Show editor in the cell
          if (isEditing && idx === editingCell!.rowIdx && editingRecord) {
            return (
              <CellEditor
                column={col}
                value={value}
                record={editingRecord}
                products={products}
                onCommit={commitCellEdit}
                onCancel={() => setEditingCell(null)}
              />
            );
          }

          // Auto-computed display
          if (col.type === 'auto') {
            const val = record[col.key] ?? 0;
            return (
              <span style={{ fontWeight: 600, color: Number(val) > 0 ? '#059669' : '#94a3b8', whiteSpace: 'nowrap' }}>
                ¥{Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </span>
            );
          }

          // Product column: show name
          if (col.type === 'product' && value && products) {
            const p = products.find((p) => p.id === value);
            if (p) {
              return <span style={{ fontSize: 12 }}>{p.name || p.code}</span>;
            }
            return <span style={{ color: '#94a3b8', fontSize: 12 }}>产品#{value}</span>;
          }

          // Number formatting
          if (col.type === 'number' && value !== undefined && value !== null && value !== '') {
            if (col.key === 'unit_price') {
              return <span style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                ¥{Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </span>;
            }
            return <span style={{ fontSize: 12 }}>{Number(value).toLocaleString('zh-CN')}</span>;
          }

          // Select display
          if (col.type === 'select' && value && col.options) {
            const opt = col.options.find((o) => o.value === value);
            return <span style={{ fontSize: 12 }}>{opt?.label || value}</span>;
          }

          if (value === undefined || value === null || value === '') {
            return <span style={{ color: '#cbd5e1' }}>-</span>;
          }

          return <span style={{ fontSize: 12 }}>{String(value)}</span>;
        },
      };
    }),
    {
      title: '',
      key: '__delete',
      width: 48,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: any, record: any, idx: number) => {
        if (record[rowKey] && String(record[rowKey]).startsWith('__empty__') && !record._modified) {
          return null;
        }
        return (
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => { e.stopPropagation(); handleDeleteRow(idx); }}
          />
        );
      },
    },
  ];

  // Totals row
  const totalRow = totals ? {
    [rowKey]: '__totals__',
    ...Object.fromEntries(columns.map((c) => [c.key, ''])),
    ...(totals ? { [totals.key]: totals.calc(items) } : {}),
  } : null;

  return (
    <div>
      {/* Search bar */}
      {onSearchProduct && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <Input.Search
            placeholder="搜索产品名称/编号/规格添加明细行..."
            onSearch={onSearchProduct}
            style={{ maxWidth: 360 }}
            size="small"
            enterButton={<SearchOutlined />}
            allowClear
          />
          {productSearchResults && productSearchResults.length > 0 && (
            <Select
              showSearch
              placeholder="选择产品"
              style={{ minWidth: 280 }}
              size="small"
              optionFilterProp="label"
              filterOption={(input, option) => {
                const label = (option?.label as string || '').toLowerCase();
                return label.includes(input.toLowerCase());
              }}
              options={productSearchResults.map((p) => ({
                value: p.id,
                label: `${p.name || p.code || ''} ${p.spec || ''}`.trim().slice(0, 60),
              }))}
              onChange={(id) => {
                const p = productSearchResults.find((p) => p.id === id);
                if (p && onAddProduct) onAddProduct(p);
              }}
              onDropdownVisibleChange={(open) => { if (!open && onSearchProduct) onSearchProduct(''); }}
            />
          )}
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              const newRow: Record<string, any> = { [rowKey]: `__new__${Date.now()}`, _isNew: true };
              const newItems = [...items, newRow];
              onChange(newItems);
            }}
          >
            添加空行
          </Button>
        </div>
      )}

      {/* Data grid */}
      <Table
        rowKey={rowKey}
        size="small"
        columns={tableColumns}
        dataSource={displayItems}
        pagination={false}
        scroll={{ x: columns.reduce((s, c) => s + (c.width || 100), 200), y: 400 }}
        summary={() => {
          if (!totals || items.length === 0) return null;
          const totalVal = totals.calc(items);
          return (
            <Table.Summary.Row style={{ background: '#f0f5ff', fontWeight: 600 }}>
              <Table.Summary.Cell index={0} align="center">
                <span style={{ fontSize: 13, color: '#1e40af' }}>合计</span>
              </Table.Summary.Cell>
              {columns.map((col, idx) => {
                if (col.key === totals.key) {
                  return (
                    <Table.Summary.Cell key={col.key} index={idx + 1} align="right">
                      <span style={{ color: '#dc2626', fontSize: 13 }}>
                        ¥{totalVal.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </span>
                    </Table.Summary.Cell>
                  );
                }
                // Total quantities
                if (col.key === 'quantity') {
                  const totalQty = items.reduce((s, i) => s + Number(i.quantity || 0), 0);
                  return (
                    <Table.Summary.Cell key={col.key} index={idx + 1} align="right">
                      <span style={{ color: '#1e40af', fontSize: 13 }}>{totalQty}</span>
                    </Table.Summary.Cell>
                  );
                }
                return <Table.Summary.Cell key={col.key} index={idx + 1}>{''}</Table.Summary.Cell>;
              })}
              <Table.Summary.Cell index={columns.length + 1}>{''}</Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
        locale={{ emptyText: (
          <div style={{ padding: 24, color: '#94a3b8' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
            <div>暂无明细行</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              搜索产品添加，或点击「添加空行」手动输入
            </div>
          </div>
        ) }}
        onRow={(record, idx) => ({
          onClick: () => { if (idx !== undefined) setActiveRow(idx); },
          style: {
            background: idx !== undefined && idx === activeRow ? '#eff6ff' : undefined,
            cursor: 'pointer',
            transition: 'background 0.15s',
          },
        })}
      />
    </div>
  );
};

export default SpreadsheetItemTable;
