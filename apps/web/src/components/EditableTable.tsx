import React, { useRef, useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, DatePicker } from 'antd';
import type { InputRef } from 'antd';
import dayjs from 'dayjs';

// ── 可编辑单元格 ──────────────────────────────────
interface EditableCellProps {
  editing: boolean;
  dataIndex: string;
  title: string;
  inputType: 'text' | 'number' | 'select' | 'date';
  record: any;
  index?: number;
  children: React.ReactNode;
  options?: { value: any; label: string }[]; // for select
  onSave?: (record: any) => void; // Enter key save
}

export const EditableCell: React.FC<EditableCellProps> = ({
  editing, dataIndex, inputType, record, children, options, onSave, ...rest
}) => {
  const inputRef = useRef<InputRef>(null);
  const form = Form.useFormInstance();

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select?.();
    }
  }, [editing]);

  const handlePressEnter = () => {
    if (onSave) onSave(record);
  };

  let inputNode: React.ReactNode;

  switch (inputType) {
    case 'number':
      inputNode = (
        <InputNumber
          ref={inputRef as any}
          min={0}
          step={0.01}
          style={{ width: '100%' }}
          onPressEnter={handlePressEnter}
        />
      );
      break;
    case 'select':
      inputNode = (
        <Select
          ref={inputRef as any}
          showSearch
          optionFilterProp="label"
          options={options}
          style={{ width: '100%' }}
          onKeyDown={(e) => { if (e.key === 'Enter') handlePressEnter(); }}
        />
      );
      break;
    case 'date':
      inputNode = (
        <DatePicker
          style={{ width: '100%' }}
          format="YYYY-MM-DD"
          onKeyDown={(e) => { if (e.key === 'Enter') handlePressEnter(); }}
        />
      );
      break;
    default:
      inputNode = (
        <Input
          ref={inputRef}
          onPressEnter={handlePressEnter}
        />
      );
  }

  const cellValue = Form.useWatch(dataIndex, form);

  // In display mode for dates, show formatted string
  const displayChildren = inputType === 'date'
    ? (record[dataIndex] ? (dayjs(record[dataIndex]).isValid() ? dayjs(record[dataIndex]).format('YYYY-MM-DD') : record[dataIndex]) : (children ?? '-'))
    : children;

  return (
    <td {...rest}>
      {editing ? (
        <Form.Item name={dataIndex} style={{ margin: 0 }} initialValue={inputType === 'date' && record[dataIndex] ? dayjs(record[dataIndex]) : record[dataIndex]}>
          {inputNode}
        </Form.Item>
      ) : (
        displayChildren
      )}
    </td>
  );
};

// ── 可编辑行 ──────────────────────────────────────
interface EditableRowProps {
  index: number;
  editing: boolean;
  children?: React.ReactNode;
}

export const EditableRow: React.FC<EditableRowProps> = ({ index, editing, ...props }) => {
  return <tr {...props} style={{ ...(editing ? { background: '#f0f5ff' } : {}), ...((props as any).style || {}) }} />;
};

// ── 列类型定义 ─────────────────────────────────────
export interface EditableColumn {
  title: string;
  dataIndex: string;
  editable?: boolean;
  inputType?: 'text' | 'number' | 'select' | 'date';
  options?: { value: any; label: string }[];
  width?: number;
  fixed?: 'left' | 'right';
  align?: 'left' | 'right' | 'center';
  render?: (value: any, record: any, index: number) => React.ReactNode;
  sorter?: boolean;
}
