import React from 'react';
import { Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

/**
 * 通用表格空状态 — 替换 AntD Table 默认的"暂无数据"
 * - 提供主操作按钮 slot（典型："新建第一条"）
 * - 提供说明文案 slot
 * - 三种 preset：default / primary（带 CTA）/ minimal（仅文案）
 *
 * 用法：
 *   <Table locale={{ emptyText: <TableEmpty preset="primary" actionText="新建销售订单" onAction={openCreate} /> }} />
 *   <TableEmpty description="还没有客户" actionText="新建客户" onAction={...} />
 */
export function TableEmpty({
  description = '暂无数据',
  hint,
  actionText,
  onAction,
  preset = 'default',
}: {
  description?: string;
  hint?: string;
  actionText?: string;
  onAction?: () => void;
  preset?: 'default' | 'primary' | 'minimal';
}) {
  if (preset === 'minimal') {
    return <Empty description={description} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <div style={{ marginTop: 8 }}>
          <div style={{ color: '#8c8c8c', fontSize: 14 }}>{description}</div>
          {hint && <div style={{ color: '#bfbfbf', fontSize: 12, marginTop: 4 }}>{hint}</div>}
        </div>
      }
    >
      {actionText && onAction && (
        <Button type={preset === 'primary' ? 'primary' : 'default'} icon={<PlusOutlined />} onClick={onAction}>
          {actionText}
        </Button>
      )}
    </Empty>
  );
}

/**
 * 表格骨架屏 — AntD Skeleton 行模拟
 * 用法：loading=true 时整个 Table 用 Skeleton 替换，避免空白闪烁
 */
export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div style={{ padding: 16 }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {Array.from({ length: columns }).map((_, c) => (
            <div
              key={c}
              style={{
                flex: c === 0 ? 0.5 : 1,
                height: 20,
                background: 'linear-gradient(90deg, #f0f0f0 0%, #fafafa 50%, #f0f0f0 100%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-shimmer 1.4s ease-in-out infinite',
                borderRadius: 4,
              }}
            />
          ))}
        </div>
      ))}
      <style>{`@keyframes skeleton-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}
