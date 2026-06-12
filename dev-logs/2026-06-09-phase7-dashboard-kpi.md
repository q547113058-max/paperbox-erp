# Dev Log — 2026-06-09 (Phase 7: Dashboard KPI 卡片差异化)

## 摘要

C 档投票完成：**Dashboard KPI 卡片差异化**。

- 4 个 KPI 卡片各带独立图标 + 微色差（蓝/绿/橙/红）
- 每张卡片顶部 3px 实色边框 + 圆角图标底色
- 订单卡片加趋势对比（近7天 vs 前7天，显示百分比 + 箭头）
- 低库存卡片加警告文案（"⚠ 需要及时补货"）
- 新增财务概要区（订单总金额 / 平均订单金额 / 库存充足率）
- 近期订单表状态色统一用 getStatusColor()

## 修改文件

- `apps/web/src/pages/Dashboard.tsx` — 重写（2.9 KB → 8.0 KB）

## 新增设计

### KPI 卡片

| 卡片 | 图标 | 主色 | 背景色 | 特殊逻辑 |
|------|------|------|------|------|
| 产品数量 | AppstoreOutlined | #1677ff (蓝) | #e6f4ff | — |
| 订单数量 | ShoppingCartOutlined | #389e0d (绿) | #f6ffed | 趋势对比（↑↓—） |
| 待生产/待发货 | ToolOutlined | #d46b08 (橙) | #fff7e6 | — |
| 低库存产品 | WarningOutlined | #cf1322 (红) | #fff2f0 | >0 时红色数字 + 警告文案 |

### 财务概要

| 指标 | 说明 |
|------|------|
| 订单总金额 | 所有订单金额之和 |
| 平均订单金额 | 总金额 / 订单数 |
| 库存充足率 | (产品总数 - 低库存数) / 产品总数 × 100% |

### 趋势计算

```typescript
// 近7天 vs 前7天 订单数对比
const recent7 = orders.filter(o => now - o.created_at < 7天).length;
const prev7 = orders.filter(o => 7天 <= now - o.created_at < 14天).length;
const pct = (recent7 - prev7) / prev7 * 100;
// 显示：↑增长 100% / ↓下降 30% / —持平 0%
```

## 质量门禁

| 检查 | 结果 |
|------|------|
| vite build | ✅ EXIT 0 |
| 浏览器 snapshot | ✅ 4 个 KPI 各有图标 + 趋势指示器 + 财务概要 |

## 浏览器验证

snapshot 确认：
- 产品数量 26（AppstoreOutlined 蓝图标）
- 订单数量 23（ShoppingCartOutlined 绿图标 + "近7天 1 单，增长 100%"）
- 待生产/待发货 0（ToolOutlined 橙图标）
- 低库存产品 0（WarningOutlined 红图标）
- 财务概要：¥424,306.00 / ¥18,448.08 / 100%
- 近期订单：SO97640178 "已确认"=蓝色 Tag，其他"待确认"=橙色 Tag

## 踩坑

无。

## 后续 5 档投票

| 档位 | 建议 |
|------|------|
| A | 字体加载（Google Fonts link）+ 表格右对齐补全 |
| B | Sider Logo 重设计（去掉 Header 品牌名重复） |
| C | 部署正式服 |
| D | 暂停等反馈 |
| E | 其他（用户指定） |

**当前推荐**：A → B → C