/**
 * 统一状态色工具 — 按 design-tokens.md §1.3
 *
 * 约定：
 * - orange = 警告/待处理（需要用户行动）
 * - blue  = 进行中/已确认（系统已推进）
 * - green = 已完成/活跃/正常（终态或健康态）
 * - red   = 失败/取消/驳回（终态或异常态）
 * - default = 中性/未激活（不特别关注的状态）
 * - cyan  = 已发货（中间态，比 blue 更靠近完成）
 * - processing = 生产中（持续进行的操作，带动画点）
 *
 * 用法：
 *   import { getStatusColor } from '../utils/statusColor';
 *   <Tag color={getStatusColor(status)}>{status}</Tag>
 */

// ============ 通用映射 ============

const STATUS_COLOR: Record<string, string> = {
  // --- 待处理（橙色系，需要行动） ---
  '待确认': 'orange',
  '待审批': 'orange',
  '待排产': 'default',
  '待加工': 'orange',
  '待发货': 'orange',
  '待出单': 'default',
  '待入库': 'orange',
  '待签收': 'orange',
  '未结清': 'orange',

  // --- 进行中（蓝色系，系统已推进） ---
  '已确认': 'blue',
  '已审批': 'blue',
  '已排产': 'blue',
  '已发货': 'cyan',
  '已出单': 'default',

  // --- 生产（持续态，带动画） ---
  '生产中': 'processing',
  '加工中': 'processing',

  // --- 完成（绿色系，终态） ---
  '已完成': 'green',
  '已签收': 'green',
  '已收货': 'green',
  '已入库': 'green',
  '已确认完成': 'green',
  '已结清': 'green',

  // --- 异常/取消（红色系） ---
  '已取消': 'red',
  '已驳回': 'red',
  '已失效': 'red',
  '已冲正': 'red',

  // --- 中性 ---
  '正常生产': 'green',
  '合作中': 'green',
  '活跃': 'green',
  '在职': 'green',
  '可用': 'green',
  '已用完': 'default',
  '锁定': 'orange',
  '停售': 'red',
  '缺货': 'orange',
  '停用': 'default',
  '休假': 'orange',
  '离职': 'default',
};

/**
 * 获取状态对应的 AntD Tag 颜色
 * @param status 状态文字
 * @returns AntD color 值（'green' | 'blue' | 'orange' | 'red' | 'cyan' | 'processing' | 'default'）
 */
export function getStatusColor(status: string | null | undefined): string {
  if (!status) return 'default';
  return STATUS_COLOR[status] || 'default';
}

/**
 * 带圆点的简化状态色（用于 Dashboard 卡片等非 Tag 场景）
 */
export function getStatusDot(status: string): string {
  const color = getStatusColor(status);
  const colorMap: Record<string, string> = {
    green: '#52c41a',
    blue: '#1677ff',
    orange: '#faad14',
    red: '#f5222d',
    cyan: '#13c2c2',
    processing: '#1677ff',
    default: '#d9d9d9',
  };
  return colorMap[color] || colorMap.default;
}
