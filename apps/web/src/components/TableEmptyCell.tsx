import React from 'react';
import { Empty, Button } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';

interface BaseProps {
  /** 资源名，例如"客户"、"销售订单"（中文） */
  resource: string;
  /** 主操作按钮文字，例如"新建客户" */
  actionText?: string;
  /** 主操作回调（点 CTA 时调用） */
  onAction?: () => void;
  /** 当前搜索关键词（如果有）—— 用于区分"无数据" vs "无匹配" */
  keyword?: string;
  /** 数据是否完全为空（无任何记录）—— 为 true 时显示"未创建" preset */
  isDataEmpty?: boolean;
  /** 强制 preset，覆盖自动判断 */
  preset?: 'primary' | 'default' | 'minimal' | 'no-match';
  /** 自定义 hint（覆盖默认） */
  hint?: string;
}

/**
 * 业务页表格空状态工厂 — 单一来源收敛 14 业务页的空态展示
 *
 * 4 种 preset 自动判断逻辑：
 * - isDataEmpty=true → "未创建" preset（图标 + 描述 + 引导 + 主操作 CTA）
 * - isDataEmpty=false 且 keyword 有值 → "无匹配" preset（搜索图标 + "无匹配" + 清除建议）
 * - isDataEmpty=false 且 keyword 空 → "未创建" preset（等同于初始空态）
 * - preset='minimal' → 强制 minimal（无 CTA，只有简单文案）
 *
 * 用法：
 *   <Table
 *     dataSource={filtered}
 *     locale={{ emptyText: <TableEmptyCell resource="客户" actionText="新建客户" onAction={handleCreate} keyword={keyword} isDataEmpty={data.length === 0} /> }}
 *   />
 */
export function TableEmptyCell(props: BaseProps) {
  const { resource, actionText, onAction, keyword, isDataEmpty, preset: forcePreset, hint } = props;

  // 自动判断 preset
  let preset: 'primary' | 'no-match' | 'minimal' = 'primary';
  if (forcePreset === 'minimal') {
    preset = 'minimal';
  } else if (forcePreset === 'no-match') {
    preset = 'no-match';
  } else if (forcePreset && forcePreset !== 'primary') {
    preset = forcePreset as 'primary'; // 兜底
  } else if (!isDataEmpty && keyword && keyword.trim() !== '') {
    preset = 'no-match';
  } else {
    preset = 'primary';
  }

  if (preset === 'minimal') {
    return <Empty description={resource ? `暂无${resource}` : '暂无数据'} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  if (preset === 'no-match') {
    return (
      <Empty
        image={<SearchOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />}
        description={
          <div style={{ marginTop: 8 }}>
            <div style={{ color: '#8c8c8c', fontSize: 14 }}>没有找到匹配的{resource}</div>
            <div style={{ color: '#bfbfbf', fontSize: 12, marginTop: 4 }}>
              试试调整搜索关键词"{keyword}"，或清除筛选条件
            </div>
          </div>
        }
      />
    );
  }

  // preset === 'primary'（未创建 — 应主动引导）
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <div style={{ marginTop: 8 }}>
          <div style={{ color: '#8c8c8c', fontSize: 14 }}>还没有{resource}</div>
          <div style={{ color: '#bfbfbf', fontSize: 12, marginTop: 4 }}>
            {hint ?? '点击下方按钮创建第一条记录'}
          </div>
        </div>
      }
    >
      {actionText && onAction && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onAction}>
          {actionText}
        </Button>
      )}
    </Empty>
  );
}
