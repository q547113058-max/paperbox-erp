# Dev Log — 2026-06-09 (Phase 4)

## 摘要

修补缺失的核心业务流程端点。按功能对比表 P0/P1 实现：

- P0-1: 工单流程（订单→工单→排产→完工→入库）
- P0-2: 采购流程（采购单→审批→入库）
- P0-3: 订单/发货状态流转（发货单→发货→签收）
- P1-4: 产品图片管理（4 个图片端点）
- P1-5: 委外流程（委外单→完工→领用→结算）
- P1-6: 对账流程（自动生成对账单→确认）
- P1-7: 仓库高级功能（按编码查询、批量发货、库存出入库）

## 新增端点清单

### 工单（work_orders）
- `POST /api/work_orders/from-order` — 从订单自动生成工单
- `PUT  /api/work_orders/:id/schedule` — 排产（指派工人+时间）
- `PUT  /api/work_orders/:id/start` — 开始生产
- `POST /api/work_orders/:id/complete` — 完工 + 自动入库
- `POST /api/work_orders/:id/cancel` — 取消

### 采购（purchases）
- `POST /api/purchases/:id/approve` — 审批（通过/驳回）
- `POST /api/purchases/:id/receive` — 入库（材料→车间库存）
- `POST /api/purchases/:id/cancel` — 取消
- `GET  /api/purchases/by-no/:no` — 按单号查询

### 发货（deliveries）
- `POST /api/deliveries/from-work-order` — 从工单/订单创建发货单 + 库存扣减
- `PUT  /api/deliveries/:id/ship` — 发货（更新订单发货进度）
- `POST /api/deliveries/:id/sign` — 签收（订单状态自动推进）
- `POST /api/deliveries/batch-ship` — 批量发货
- `GET  /api/deliveries/by-no/:no` — 按单号查询

### 产品（products）
- `GET  /api/products/by-code/:code` — 按编码扫码查询
- `GET  /api/products/search?q=` — 模糊搜索
- `POST /api/products/:id/stock` — 库存出入库（带超卖检查）
- `GET  /api/products/:id/images` — 获取产品图片
- `POST /api/products/:id/images` — 添加一张图片
- `POST /api/products/:id/images/batch` — 批量上传图片
- `PUT  /api/products/:id/images/order` — 重排顺序
- `DELETE /api/products/:id/images/:imageId` — 删除图片

### 委外（outsourcing_orders）
- `POST /api/outsourcing_orders/:id/complete` — 完工 + 自动入库
- `POST /api/outsourcing_orders/:id/entry` — 委外领用
- `POST /api/outsourcing_orders/:id/cancel` — 取消
- `POST /api/outsourcing_orders/:id/settle` — 结算

### 对账（reconciliation_bills）
- `POST /api/reconciliation_bills/generate` — 自动生成对账单（拉已签收发货单）
- `POST /api/reconciliation_bills/:id/confirm` — 确认
- `POST /api/reconciliation_bills/:id/cancel` — 取消

## 修改文件

| 文件 | 改动 |
|------|------|
| `work_orders/work_orders.service.ts` | 重写 + 添加 5 个业务流程方法 |
| `work_orders/work_orders.controller.ts` | 添加 5 个端点 |
| `work_orders/work_orders.module.ts` | 注入 7 个新依赖 |
| `deliveries/deliveries.service.ts` | 重写 + 添加 5 个业务流程方法 |
| `deliveries/deliveries.controller.ts` | 添加 5 个端点 |
| `deliveries/deliveries.module.ts` | 注入 7 个新依赖 |
| `purchases/purchases.service.ts` | 重写 + 添加 4 个业务流程方法 |
| `purchases/purchases.controller.ts` | 添加 4 个端点 |
| `purchases/purchases.module.ts` | 注入 4 个新依赖 |
| `products/products.service.ts` | 添加 search/by-code/stock/4 个图片方法 |
| `products/products.controller.ts` | 添加 9 个端点 |
| `products/products.module.ts` | 注入 2 个新依赖 |
| `outsourcing_orders/outsourcing_orders.service.ts` | 重写 + 添加 4 个业务流程方法 |
| `outsourcing_orders/outsourcing_orders.controller.ts` | 添加 4 个端点 |
| `outsourcing_orders/outsourcing_orders.module.ts` | 注入 3 个新依赖 |
| `reconciliation_bills/reconciliation_bills.service.ts` | 重写 + 添加 3 个业务流程方法 |
| `reconciliation_bills/reconciliation_bills.controller.ts` | 添加 3 个端点 |
| `reconciliation_bills/reconciliation_bills.module.ts` | 注入 4 个新依赖 |
| `jest.config.js` | 修复 testMatch 排除 .d.ts |

## 验证结果

### 质量门禁
- `npx tsc --noEmit -p apps/server/tsconfig.json` → **EXIT 0**（3 个初版错误已修）
- `./node_modules/.bin/jest --silent` → **15/15 passed, 2 suites passed**

### 端到端业务流程（实跑通过）
- P0-1: 订单 25 → 自动生成工单 31 → 排产 → 开始 → 完工 → 自动入库（inventory id=11）
- P0-2: 创建采购单 7 → 审批 → 入库（inventories=2）
- P0-3: 创建发货单 8 → ship → sign → 订单状态自动更新
- P1-4: 产品 27 添加 3 张图片 → 批量上传 → 重排 → 删除单张
- P1-5: 创建委外单 9 → complete → entry → settle（is_settled=1）
- P1-6: 自动对账 4 (RB20260609...) → confirm
- P1-7: 按编码查询 BS3-TEST-001 → stock in 50 → stock out 10 → 不足时 400 拒绝

## 踩坑

1. **work_orders 表无 remark 字段** — 取消原因复用 entry_code 字段存
2. **deliveries.service.ts 误用 findOne + product_id** — workshop_inventory 表没 product_id 字段，改 QueryBuilder
3. **jest.config testMatch 把 .d.ts 当 spec 跑** — 加 `**/*-spec.ts` 显式匹配

## 遗留 / 待办

- P2: image_library 查询（表不存在，待业务需要时建表）
- P2: purchasereq 表（不存在，待业务需要时建表）
- 前端页面按钮还没接上这些新端点（待前端调整）