# 纸箱 ERP 新旧系统功能对比

## 对比日期：2026-06-09

## 总体统计

| 类别 | 旧系统 | 新系统 | 完成度 |
|------|--------|--------|--------|
| 路由文件 | 25 个 | 39 个 Controller | 156% |
| API 端点 | ~120 个 | 186 个 | 155% |
| 业务模块 | 25 个 | 38 个 | 152% |

## 功能对比详情

### ✅ 已完整实现（6 个模块）

| 旧系统路由 | 新系统模块 | 端点数 | 说明 |
|-----------|-----------|--------|------|
| auth.js | auth/ | 10 | JWT登录、账户CRUD、权限管理 |
| customers.js | customers/ | 5 | 客户CRUD |
| personnel.js | personnel/ | 4 | 人员CRUD |
| suppliers.js | suppliers/ | 4 | 供应商CRUD |
| specOptions.js | spec_options/ | 4 | 规格选项CRUD |
| errorLogs.js | error_logs/ | 4 | 错误日志CRUD |

### ⚠️ 部分实现（15 个模块）

#### 1. orders.js → orders/
**缺少：**
- `PUT /orders/:id/status` — 更新订单状态
- `PUT /order-items/:id/manual-close` — 手动关闭订单项

#### 2. products.js → products/
**缺少：**
- `POST /products/:id/option-image` — 上传选项图片
- `POST /products/:id/knife-die-image` — 上传刀模图片
- `POST /products/:id/print-plate-image` — 上传印版图片
- `POST /products/:id/finished-product-image` — 上传成品图片

#### 3. deliveries.js → deliveries/
**缺少：**
- `POST /deliveries/from-order` — 从订单创建发货单
- `PUT /deliveries/:id/ship` — 发货
- `PUT /deliveries/:id/sign` — 签收
- `PUT /deliveries/:id/status` — 更新状态

#### 4. warehouse.js → warehouse_entries/
**缺少：**
- `POST /warehouse-entries/from-workorder` — 从工单创建入库
- `PUT /warehouse-entries/:id/status` — 更新状态
- `POST /warehouse-entries/:id/create-delivery` — 创建发货单
- `GET /warehouse-entries/lookup/:entryCode` — 按编码查询
- `POST /warehouse-entries/by-code` — 按编码入库
- `POST /warehouse-entries/batch-delivery` — 批量发货

#### 5. workorders.js → work_orders/
**缺少：**
- `POST /workorders/from-order/:orderId` — 从订单创建工单
- `POST /workorders/from-product` — 从产品创建工单
- `PUT /workorders/:id/status` — 更新状态
- `PUT /workorders/:id/partial-complete` — 部分完工
- `DELETE /workorders/:id` — 删除工单
- `POST /workorders/batch-from-orders` — 批量创建工单

#### 6. purchases.js → purchases/
**缺少：**
- `GET /purchases/:id/items` — 获取采购明细
- `POST /purchases` — 创建采购单
- `PUT /purchases/:id/status` — 更新状态
- `POST /purchases/:id/generate-no` — 生成单号
- `POST /purchases/:id/update-no` — 更新单号

#### 7. outsourcing.js → outsourcing_orders/
**缺少：**
- `POST /outsourcing-orders/from-workorder` — 从工单创建委外单
- `PUT /outsourcing-orders/:id/status` — 更新状态
- `POST /outsourcing-orders/:id/receive` — 接收委外
- `GET /workorders/:workOrderId/outsourcing-orders` — 工单关联委外单
- `POST /outsourcing-orders/:id/generate-no` — 生成单号
- `POST /outsourcing-orders/:id/update-no` — 更新单号

#### 8. reconciliation.js → reconciliation_bills/
**缺少：**
- `POST /reconciliation-bills/from-deliveries` — 从发货单创建对账单
- `PUT /reconciliation-bills/:id/status` — 更新状态
- `DELETE /reconciliation-bills/:id` — 删除
- `GET /customers/:customerId/deliveries-for-reconciliation` — 客户可对账发货单

#### 9. colorPrints.js → color_prints/
**缺少：**
- `GET /print-items` — 获取印件列表
- `POST /color-prints/:id/items` — 添加印件
- `PUT /print-items/:id` — 更新印件
- `DELETE /print-items/:id` — 删除印件
- `POST /print-items/:id/images` — 上传印件图片
- `GET /print-items/:id/images` — 获取印件图片
- `DELETE /print-item-images/:id` — 删除印件图片

#### 10. knifeDies.js → knife_dies/
**缺少：**
- 图片上传功能（已有 controller 但需验证 multer 配置）

#### 11. workshop.js → workshop_inventory/
**缺少：**
- `GET /workshop-inventory/summary` — 库存汇总
- `POST /workshop-inventory/issue` — 发料
- `GET /workorders/:workOrderId/materials` — 工单物料

#### 12. misc.js (production) → production_orders/
**缺少：**
- 生产订单的完整业务逻辑（状态流转、关联工单）

#### 13. misc.js (stock/in) → stock_logs/
**缺少：**
- `POST /stock/in` — 手动入库

#### 14. misc.js (finance) → finance_records/
**缺少：**
- `PUT /finance/records/:id/settle` — 结算
- `POST /finance/records/:id/cancel` — 冲正

#### 15. misc.js (finance/fixed-items) → finance_fixed_items/
**缺少：**
- `POST /finance/fixed-items/apply` — 应用固定项

### ❌ 未实现（2 个模块）

#### 1. imageLibrary.js → 无对应
**端点：**
- `GET /image-library/knife-dies` — 刀模图片库
- `GET /image-library/print-plates` — 印版图片库

#### 2. purchasereq.js → 无对应
**端点：**
- `POST /from-order/:orderId` — 从订单生成采购需求
- `POST /from-products` — 从产品生成采购需求
- `POST /from-workorder/:workOrderId` — 从工单生成采购需求
- `POST /create-purchase` — 创建采购单
- `GET /materials` — 物料列表
- `POST /materials/stock-in` — 物料入库

## 优先级排序

### P0 核心业务流程（必须实现）

1. **工单流程**：订单 → 工单 → 入库 → 发货
   - `POST /workorders/from-order/:orderId`
   - `POST /warehouse-entries/from-workorder`
   - `POST /deliveries/from-order`

2. **采购流程**：采购需求 → 采购单 → 入库
   - `POST /purchasereq/from-order/:orderId`
   - `POST /purchases` + `PUT /purchases/:id/status`
   - `POST /materials/stock-in`

3. **订单状态流转**
   - `PUT /orders/:id/status`

4. **发货状态流转**
   - `PUT /deliveries/:id/ship`
   - `PUT /deliveries/:id/sign`

### P1 重要功能（应该实现）

5. **产品图片管理**
   - `POST /products/:id/option-image`
   - `POST /products/:id/knife-die-image`
   - `POST /products/:id/print-plate-image`
   - `POST /products/:id/finished-product-image`

6. **委外流程**
   - `POST /outsourcing-orders/from-workorder`
   - `POST /outsourcing-orders/:id/receive`

7. **对账流程**
   - `POST /reconciliation-bills/from-deliveries`
   - `PUT /reconciliation-bills/:id/status`

8. **仓库高级功能**
   - `GET /warehouse-entries/lookup/:entryCode`
   - `POST /warehouse-entries/batch-delivery`

### P2 辅助功能（可以后做）

9. **图片库查询**
   - `GET /image-library/knife-dies`
   - `GET /image-library/print-plates`

10. **财务结算**
    - `PUT /finance/records/:id/settle`
    - `POST /finance/records/:id/cancel`

11. **车间管理**
    - `GET /workshop-inventory/summary`
    - `POST /workshop-inventory/issue`

## 实现计划

### Phase 1：核心业务流程（P0）
- 实现工单流程（订单→工单→入库→发货）
- 实现采购流程（需求→采购→入库）
- 实现订单/发货状态流转

### Phase 2：重要功能（P1）
- 产品图片管理
- 委外流程
- 对账流程

### Phase 3：辅助功能（P2）
- 图片库查询
- 财务结算
- 车间管理
