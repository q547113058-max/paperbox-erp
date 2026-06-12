# Dev Log — 2026-06-09 (Phase 5: 前端接 P0/P1 业务流程端点)

## 摘要

完成 findings 中 A 档投票：**前端接 P0/P1 业务流程端点**。

- 新建 3 个 page: WorkOrders / OutsourcingOrders / ReconciliationBills
- 改 4 个 page: Orders（生成工单）/ Purchases（审批/入库/取消 + 新建）/ Deliveries（发货/签收 + 创建）/ Warehouse（Tabs + 新增入库）
- Layout.tsx + App.tsx 注册新菜单/路由
- types/api.ts 扩 7 个新类型（WorkOrder / OutsourcingOrder / ReconciliationBill / ReconciliationItem / WorkshopInventory / WorkshopInventoryLog + Delivery 字段补全）

## 修改文件

### 新建
- `apps/web/src/pages/WorkOrders.tsx` (7.6 KB)
- `apps/web/src/pages/OutsourcingOrders.tsx` (8.0 KB)
- `apps/web/src/pages/ReconciliationBills.tsx` (8.3 KB)

### 改写
- `apps/web/src/pages/Orders.tsx` — 加 "生成工单" 操作列 + 金额/成本/利润列右对齐
- `apps/web/src/pages/Purchases.tsx` — 重写加 审批/驳回/入库/取消 操作列 + 新建采购弹窗
- `apps/web/src/pages/Deliveries.tsx` — 重写加 发货/签收 操作列 + 创建发货单弹窗 + 送货人/地址/签收时间列
- `apps/web/src/pages/Warehouse.tsx` — Tabs 切3 视图（车间库存/库存日志/入库记录）+ 新增入库/出库弹窗

### 注册
- `apps/web/src/App.tsx` — lazy import + 3 个新 Route
- `apps/web/src/components/Layout.tsx` — 3 个新 menuItem + ToolOutlined/ApiOutlined/FileTextOutlined 图标 + boss/finance/warehouse ROLE_PERMISSIONS 扩字段

### 类型
- `apps/web/src/types/api.ts` — 5.1 KB，新增 WorkOrder/OutsourcingOrder/ReconciliationBill/ReconciliationItem/WorkshopInventory/WorkshopInventoryLog 6 个 interface + Delivery 字段补全

## 质量门禁

| 检查 | 命令 | 结果 |
|------|------|------|
| 后端 tsc | `npx tsc --noEmit -p apps/server/tsconfig.json` | ✅ EXIT 0 |
| 后端 jest | `./node_modules/.bin/jest --silent` | ✅ EXIT 0 |
| 前端 build | `cd apps/web && npx vite build` | ✅ EXIT 0，3 个新 page 单独 chunk（5-6 KB） |
| 浏览器闭环 | 6 个新 page 全部渲染、操作列正确 | ✅ |

## 端到端验证（截图存档）

| Page | 路由 | 操作列行为 | 验证 |
|------|------|------|------|
| WorkOrders | /work_orders | 待排产→排产/取消；已排产→开始/完工；生产中→完工 | ✅ |
| Purchases | /purchases | 待审批→通过/驳回/入库/取消；已审批→入库/取消 | ✅ |
| Deliveries | /deliveries | 待发货→发货；已发货→签收；已签收→绿色 tag"已完成" | ✅ |
| Warehouse | /warehouse | Tabs 切 车间库存(12条) / 库存日志 / 入库记录 + 新增入库按钮 | ✅ |
| OutsourcingOrders | /outsourcing_orders | 待加工→完工/领用/取消；已完成未结算→结算 | ✅ |
| ReconciliationBills | /reconciliation_bills | 待确认→详情/确认/取消；已确认→详情；单号可点击看明细 | ✅ |
| Orders | /orders | 编辑/生成工单/删除 | ✅ 点击"生成工单"按钮 → 订单1 工单数 1→3 |

## 业务闭环验证

点击 Orders 页订单1 (SO97640178) 的"生成工单"按钮：
- POST /api/work_orders/from-order {order_id:1} → 创建工单
- 数据库验证：`SELECT * FROM work_orders WHERE order_id=1` → 3 条（之前 1 条）
- 前端弹 message.success("已生成 X 个工单")

## 踩坑

1. **patch 上下文混淆** — Layout.tsx 用 patch 修改时，由于 old_string 只匹配局部，结果产生 array 重复 + import 重复。修法：write_file 整文件重写（20+ 行 → 干净版本）
2. **LSP 缓存** — TypeScript 文件被正确改写后，patch 返回的 diff 里显示旧 LSP 错误（如 `Cannot redeclare 'Products'`），但实际 tsc EXIT0。LSP 是 IDE 缓存，不是真实编译错误。

## 当前会话质量等级

Phase 5 完成后：**A**
- 已做：脚手架 / TypeORM entities / JWT 鉴权 / CRUD 模块 / 前端 14 页面（含 Phase 5 新增 3 个） / 端到端验证 / ESLint / 单元测试 / smoke 测试 / P0-P1 业务后端 30 端点 / P0-P1 业务流程前端接入 / design-tokens 文档 / refactor-findings 增量
- 已补：project-requirements / refactor-findings / design-tokens / dev-logs
- 遗留（已记录在 findings）：27 ESLint warnings / 状态色细节 / Noto Sans SC 字体加载 / 响应式实测 / Loading skeleton / ErrorBoundary / 表格 hover 高亮 / 数字列右对齐（部分已加）/ Sider+Header 品牌名重复

## 后续 5 档投票（基于新发现）

| 档位 | 建议 |
|------|------|
| A | B 档状态色映射落地（按 design-tokens.md §1.3） |
| B | Dashboard KPI 卡片差异化 |
| C | 字体加载 + 表格右对齐 + Sider Logo 重设计（视觉打磨） |
| D | 部署到正式服 |
| E | 暂停，等待用户反馈 |

**当前推荐**：A → B → C（每个 commit 一档，便于回滚）