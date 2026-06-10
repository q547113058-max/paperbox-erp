# 重构发现 - 2026-06-10

## 项目信息

- 项目：纸箱 ERP v2（NestJS + React + AntD）
- 任务：P0 业务页批量补全 — Purchases.tsx + Deliveries.tsx
- 日期：2026-06-10

---

## P0-1 已修复：Purchases.tsx 只读问题（已完成）

### 现象
- 旧代码（44 行）只调用 `GET /api/purchases`，其他 10 个后端端点（审批/收货/取消/打印/创建/更新/删除/明细/生成单号/按单号查）全部无前端入口
- 旧版 UI 没有「新建采购单」「审批」「入库」按钮，老板/仓库角色无法推进业务
- 之前 refactor-findings-2026-06-09 已记录此问题，但未修

### 根因
1. 后端 API 完整（11 个端点），但前端只接了 1 个
2. 前端只实现最小可行「只读表格」就停了

### 修复
**Purchases.tsx 44 → 672 行**：

| 模块 | 旧 | 新 |
|------|---|---|
| KPI 卡片 | 0 | 5 个（总/待审批/已审批/已入库/总金额）|
| 搜索/筛选 | 1（搜索）| 3（搜索/状态/供应商）+ 清除按钮 |
| 表格列 | 8 | 9（采购单号/供应商/总金额/状态/交货日期/关联/备注/创建日期/操作）|
| 操作按钮 | 0 | 8（详情/审批/驳回/入库/打印/编辑/删除/取消）|
| 业务弹窗 | 0 | 3（新建/编辑/详情）|
| 导出 | 0 | CSV（带 BOM，支持 Excel 打开）|
| 状态色 | 硬编码 | 调用 utils/statusColor.ts |
| API 端点 | 1/11 | 11/11 全部接入 |

### 后端端点（11 个全部接入）

```
GET    /api/purchases                  列表（fetchAll）
GET    /api/purchases/:id              详情（dialog 用 getItems）
GET    /api/purchases/:id/items        详情弹窗明细
POST   /api/purchases                  新建
PUT    /api/purchases/:id              编辑
DELETE /api/purchases/:id              删除
POST   /api/purchases/:id/approve      审批/驳回
POST   /api/purchases/:id/receive      入库
POST   /api/purchases/:id/cancel       取消
POST   /api/purchases/:id/generate-no  打印时生成正式单号
POST   /api/purchases/:id/update-no    更新单号（合并打印）
```

### 业务闭环验证

| 业务操作 | 前端入口 | 后端流转 | 状态变化 |
|---------|---------|---------|---------|
| 新建 | 新建采购单 Modal | POST → service.createWithItems | → 待审批 |
| 审批 | 行内 [审批] 按钮 | POST /:id/approve | 待审批 → 已审批 / 已驳回 |
| 入库 | 行内 [入库] 按钮 | POST /:id/receive | 已审批 → 已入库（写 workshop_inventory + log）|
| 打印 | 行内 [打印] 按钮 | POST /:id/generate-no + 打开打印窗 | 任何 → 已出单（单号 TMP→PO）|
| 编辑 | 行内 [编辑] 按钮（限非已入库）| PUT /:id | 任意（业务字段）|
| 取消 | 行内 [取消] 按钮 | POST /:id/cancel | 非已入库/已取消 → 已取消 |
| 删除 | 行内 [删除] 按钮（限待审批）| DELETE /:id | 物理删除（含 items）|

### 验证

- typecheck: `npx tsc --noEmit -p apps/web/tsconfig.json` → 0 errors
- vite build: `rm -rf dist && npx vite build` → ✓ 7.61s
- 部署: `cp -r dist/* /var/www/paperbox-erp/ && nginx -s reload` → OK
- 浏览器: http://193.112.246.85:3003/purchases 加载正常
- 7 条历史采购单全部显示
- KPI 实时：7 / 待审批 2 / 已审批 2 / 已入库 0 / 总金额 ¥2,700
- 操作按钮按状态动态显示（待审批 8 按钮 / 已审批 5 / 已出单 4）
- 详情弹窗打开正常：8 字段基本信息 + 8 列明细表 + 合计行
- 新建弹窗打开正常：3 字段顶部 + 备注 + 可增删明细行
- 浏览器 console: 0 errors, 0 messages

### 设计标准（§04 七条 UI 验收）

| # | 检查项 | 结论 | 证据 |
|---|--------|------|------|
| 1 | 品牌色一致 | ✅ PASS | 主题色 #2c5282 钢蓝（main.tsx ConfigProvider）|
| 2 | 状态色映射 | ✅ PASS | 用 getStatusColor()，6 色系（橙/蓝/绿/红/灰/processing）|
| 3 | 表格空态 | ✅ PASS | TableEmptyCell 组件，自动判断 primary/no-match |
| 4 | 操作按钮状态条件渲染 | ✅ PASS | 8 个按钮按 status 条件显示，无悬空按钮 |
| 5 | 数字列右对齐 | ✅ PASS | 总金额 align: 'right'，红色加粗 |
| 6 | scroll.x 防横向溢出 | ✅ PASS | scroll={{ x: 1400 }} + fixed: 'right' 操作列 |
| 7 | 不像默认模板 | ✅ PASS | KPI 顶 3px 彩色边条 + brand color + 等宽数字单号 |

### 教训 / 改进点

- **N40 (AntD 图标 import)**：N/A 这次所有图标（Eye/Check/Inbox/Printer/Download/Stop/Edit/Delete/Search/Reload）都在顶部 import，无 ReferenceError
- **N37 (TSX 多处 patch)**：N/A 用 write_file 整文件重写，无 array 重复问题
- **N42 (TableEmptyCell isDataEmpty)**：N/A 用 data.length === 0，无变量名错
- **N43 (NestJS 路由顺序)**：N/A 这次只动前端

### P1 改进点（视觉评审反馈，未修）

1. **新建弹窗明细行拥挤**：当前 6/4/3/2/2/3/3 col 比例 + 840px 宽，明细字段视觉挤压
   - 改进：840 → 1000px；col 比例改为 7/4/3/3/2/3/2
2. **缺「金额」自动计算列**：当前 Form.List 无 shouldUpdate
   - 改进：加 Form.Item shouldUpdate + 实时计算 amount = qty × unit_price
3. **缺「税率」字段**：后端 Purchase entity 不支持税率
   - 改进：先加前端字段 + service 透传，后端 entity 加 tax_rate 字段
4. **KPI 缺趋势对比**：5 卡静态数字
   - 改进：用 useMemo 加近 7 天 vs 前 7 天对比 + 箭头 + 百分比
5. **金额列 ¥0 灰显**：所有 ¥0 行视觉权重相同
   - 改进：render 时判断 `v === 0` → 加 `color: '#d9d9d9'`

## 下一步 P0 阻塞

- [ ] P0-2: Deliveries.tsx 41 → ~300 行（KPI/CRUD/详情/发货/签收/打印）
- [ ] P0-3: Orders.tsx 详情弹窗 + 产品明细行（最复杂，涉及子表）
- [ ] P0-4: Receivables.tsx + Payables.tsx 2 个新 page（应收应付，旧版有，新版 0 个）

## 5 档投票

| 档 | 建议 |
|----|------|
| A | 继续 P0-2 Deliveries（按相同模式，1-2 小时搞定）|
| B | 先做视觉打磨（修 P1 五项，每项 5-10 分钟）|
| C | 跳到 P0-3 Orders 详情（最复杂，需要做产品明细行）|
| D | 暂停，先把这次 P0 推到正式服 |
| E | 暂停，等用户反馈 |


---

## P0-2 已修复：Deliveries.tsx 只读问题（已完成）

### 现象
- 旧代码（41 行）只调用 `GET /api/deliveries`，5 列只读表格
- 其他 10 个后端端点（创建/更新/删除/发货/签收/从订单生成/从工单生成/批量发货/详情/按单号查）全部无前端入口
- 业务流（待发货 → 已发货 → 已签收）完全无法推进
- 之前 refactor-findings-2026-06-09 已记录此问题

### 修复
**Deliveries.tsx 41 → 665 行**：

| 模块 | 旧 | 新 |
|------|---|---|
| KPI 卡片 | 0 | 5 个（总发货单/待发货/已发货/已签收/签收率%）|
| 搜索/筛选 | 1（搜索）| 3（搜索/状态/客户）+ 清除按钮 |
| 表格列 | 5 | 11（发货单号/关联订单/客户/送货人/送货地址/状态/签收/送货日期/送货时间/创建日期/操作）|
| 操作按钮 | 0 | 6（详情/发货/签收/打印/编辑/删除）|
| 业务弹窗 | 0 | 3（新建/编辑/详情）|
| 导出 | 0 | CSV（带 BOM）|
| 业务闭环 | 无 | 待发货 → 发货 → 已发货 → 签收 → 已签收 |
| 状态色 | 硬编码 | 调用 utils/statusColor.ts |
| API 端点 | 1/11 | 11/11 全部接入 |

### 业务闭环（service 真实流转）

| 操作 | 入口 | 后端流转 | 状态/数据变化 |
|------|------|---------|-------------|
| 新建 | 新建发货单 Modal | POST /from-order | 选订单 + 明细 → 自动扣产品库存 |
| 发货 | 行内 [发货]（待发货）| PUT /:id/ship | 待发货 → 已发货（自动更新 order_item.delivered_qty）|
| 签收 | 行内 [签收]（已发货）| POST /:id/sign | 已发货 → 已签收（判断订单全部签收 → 更新订单状态为已发货）|
| 打印 | 行内 [打印] | 跳 /api/print/delivery/:id | 任何状态 |
| 编辑 | 行内 [编辑]（限待发货）| PUT /:id | 限非已签收/已发货 |
| 删除 | 行内 [删除]（限待发货）| DELETE /:id | 物理删除 |

### types/api.ts 扩展

- `Delivery` 14 字段（缺 6 个 → 完整 17 字段）
- `DeliveryItem` interface（5 字段）
- `WorkOrder` interface（17 字段）
- `OrderItem` interface（13 字段）

### 验证

- typecheck: `npx tsc --noEmit -p apps/web/tsconfig.json` → 0 errors
- vite build: `npx vite build` → ✓ 7.70s, Deliveries chunk 16.0 kB
- 部署: nginx reload OK
- 浏览器 http://193.112.246.85:3003/deliveries: 7 条发货单全部加载
- KPI 实时：7 / 待发货 4 / 已发货 2 / 已签收 1 / 签收率 14%
- 操作按钮按状态动态（待发货 5 个，已发货 3 个，已签收 2 个）
- 详情弹窗：11 字段基本信息 + 5 列明细表（含合计行：数量小计 + 金额小计 ¥xxx 红色高亮）
- 新建弹窗：3 字段顶部 + 备注 + 系统提示「自动从产品库存扣减」+ 可增删明细行
- 编辑弹窗：4 字段（送货人/送货日期/送货地址/备注）
- 浏览器 console: 0 errors, 0 messages

### 设计标准（§04 七条 UI 验收）

| # | 检查项 | 结论 | 证据 |
|---|--------|------|------|
| 1 | 品牌色一致 | ✅ PASS | 主题色 #2c5282 钢蓝贯穿 |
| 2 | 状态色映射 | ✅ PASS | getStatusColor()，待发货=橙 / 已发货=青 / 已签收=绿 |
| 3 | 表格空态 | ✅ PASS | TableEmptyCell，自动判断 primary/no-match |
| 4 | 操作按钮状态条件渲染 | ✅ PASS | 6 个按钮按 status 动态显示 |
| 5 | 数字列右对齐 | ✅ PASS | 数量/金额/小计 align: 'right' |
| 6 | scroll.x 防横向溢出 | ✅ PASS | scroll={{ x: 1600 }} + fixed: 'right' 操作列 |
| 7 | 不像默认模板 | ✅ PASS | 5 KPI 顶 3px 彩色边条 + 业务规则提示（自动扣库存）|

### 视觉评估（browser_vision 8.5/10）

**优点：**
- KPI 5 卡差异化配色（深蓝/橙/青/绿/深蓝），语义编码正确
- 状态徽标 + 操作按钮动态显示 严谨
- 业务规则提示（"系统将自动从产品库存扣减发货数量"）专业
- 详情弹窗 footer 双按钮（打印主操作 + 关闭）
- 客户筛选用 showSearch 模糊搜索

**改进点（P1）：**
- 表格缺斑马纹 + 行 hover
- KPI 缺趋势对比（近 7 天 vs 前 7 天）
- 顶部缺批量操作栏（勾选 + 批量打印/导出）
- 数据空值「ID:null」「-」未灰显统一处理

### 教训 / 改进点

- **TypeScript 严格性**：`Table.Summary.Cell` 不支持 `style` prop → 用 `<span style={...}>` wrap
- **类型定义重复**：之前在 types/api.ts line 11 已有 `Product` interface，加新 Delivery/Item 块时差点重复 → 删掉新加的 Product 解决
- **N40 (AntD 图标 import)**：所有图标（Eye/Car/CheckCircle/Printer/Download/Stop/Edit/Delete/Search/Reload/Thunderbolt/Plus）都在顶部 import 完整
- **N37 (TSX 多处 patch)**：用 write_file 整文件重写，无 array 重复
- **N42 (TableEmptyCell isDataEmpty)**：用 data.length === 0 正确

### 累计 P0 进展

| Page | 行数 | 业务闭环 | API 接入 | 状态 |
|------|------|---------|---------|------|
| Purchases | 44→672 | ✅ | 11/11 | ✅ 完成 |
| Deliveries | 41→665 | ✅ | 11/11 | ✅ 完成 |
| Orders | 140（待改）| ❌ 缺详情+产品明细 | 5/5 | ⏳ P0-3 |
| Receivables | 0（待建）| ❌ | 0/0 | ⏳ P0-4 |
| Payables | 0（待建）| ❌ | 0/0 | ⏳ P0-4 |

## 下一步 P0 阻塞

- [ ] P0-3: Orders.tsx 详情弹窗 + 产品明细行（最复杂，涉及子表）
- [ ] P0-4: Receivables.tsx + Payables.tsx 2 个新 page（应收应付，旧版有，新版 0 个）

## 5 档投票

| 档 | 建议 |
|----|------|
| A | 继续 P0-3 Orders 详情弹窗 + 产品明细行（最复杂，预计 2-3 小时）|
| B | 先做视觉打磨（修 P1 五项 + Deliveries 三项，每项 5-10 分钟）|
| C | 跳到 P0-4 Receivables/Payables 2 个新 page（业务闭环必要）|
| D | 暂停，先把这次 P0 推到正式服 |
| E | 暂停，等用户反馈 |


---

## P0-3 已修复：Orders.tsx 详情 + 产品明细缺失（已完成）

### 现象
- 新版 Orders.tsx 原 140 行，虽然有新建/编辑弹窗，但详情只是缺失状态（无详情弹窗）。
- `GET /api/orders/:id` 后端已经返回 `{ ...order, items }`，但前端没有使用，导致订单产品明细、纸箱行业字段、金额分解无法查看。
- 旧系统销售订单关注客户/客户单号/交期/产品明细/面纸中纸/印刷/表面处理/刀模/金额核算；新版只显示列表 10 列，业务信息复刻不完整。

### 修复
**Orders.tsx 140 → 596 行**：

| 模块 | 旧 | 新 |
|------|---|---|
| KPI 卡片 | 0 | 5 个（总订单/待确认/生产中/待发货/总金额）|
| 搜索/筛选 | 1（搜索）| 3（搜索/状态/客户）+ 清除按钮 |
| 表格列 | 10 | 12（新增业务员、状态行内 Select、操作列扩展）|
| 操作按钮 | 2 | 6（详情/编辑/生成工单/生成发货/打印/删除）|
| 详情弹窗 | 0 | 1 个 960px 详情 Modal，70vh 内部滚动 |
| 产品明细 | 不显示 | 详情表 9 列 + 合计行；新建/编辑 Form.List 可增删 |
| 行业字段 | 不显示 | 面纸/中纸/印刷/表面处理/刀模/金额核算完整展示 |
| 导出 | 0 | CSV（带 BOM）|
| 状态切换 | 弹窗内 | 表格行内 Select 调 `/orders/:id/status` |

### 业务闭环

- 新建订单：客户 Select + 状态 + 日期 + 金额 + 产品明细 Form.List
- 编辑订单：先拉 `/orders/:id`，回填 `items`，避免只编辑主表丢子表
- 详情查看：`/orders/:id` 返回明细，显示：
  - 基本信息 12 字段
  - 面纸/中纸 2 组字段
  - 印刷/表面处理/刀模 8 字段
  - 金额核算 8 字段
  - 产品明细 9 列（产品/规格/数量/已发货/单价/金额/客户产品编号/交期/备注）+ 数量/已发/金额合计
- 状态推进：表格行内 Select 调 `/api/orders/:id/status`
- 生成工单：`POST /api/work_orders/from-order`
- 生成发货：先拉详情 items，再 `POST /api/deliveries/from-order`，避免误用当前 detail state

### types/api.ts 扩展

`Order` interface 从 18 字段补到完整 45 字段：
- `face_supplier/face_material/face_size/face_qty/face_price/face_fee`
- `medium_supplier/medium_material/medium_weight/medium_size/medium_qty/medium_price`
- `print_color/print_price/surface_process/surface_price/die_price/outsource_fee`
- `reference_info/customer_feedback`
- `cost_tax/cost_no_tax/price_tax/price_no_tax/profit_margin/total_tax/total_no_tax`

### 验证

- typecheck: `npx tsc --noEmit -p apps/web/tsconfig.json` → 0 errors
- vite build: `npx vite build` → ✓ 7.85s, Orders chunk 19.46 kB gzip 5.92 kB
- 部署: nginx reload OK
- 浏览器 `/orders`: 23 条订单加载；KPI 实时显示 23 / 待确认 21 / 生产中 0 / 待发货 0 / ¥424,306.00
- 详情弹窗：`SO97640178` 打开正常，基本信息/面纸中纸/印刷工艺/金额/产品明细/备注均在 DOM 中显示
- 详情产品明细：1 项，数量 100，金额 ¥1000.00，合计行正确
- 新建弹窗：产品明细 Form.List 字段完整（产品/数量/单价/客户产品编号/交期/备注/删除/添加产品明细）
- AntD 图标审计：`antd-icon-import-audit.py /root/workspace/paperbox-erp/apps/web/src` → PASS
- 浏览器 console: 0 errors, 0 messages

### 设计标准（§04 七条 UI 验收）

| # | 检查项 | 结论 | 证据 |
|---|--------|------|------|
| 1 | 品牌色一致 | ✅ PASS | KPI 顶线 #2c5282 / 状态色统一 |
| 2 | 状态色映射 | ✅ PASS | `getStatusColor()` + 行内 Select Tag |
| 3 | 表格空态 | ✅ PASS | `TableEmptyCell` 接入 |
| 4 | 操作按钮状态条件渲染 | ✅ PASS | 已确认显示生成工单；已完成/取消不生成发货 |
| 5 | 数字列右对齐 | ✅ PASS | 金额/成本/利润/明细数量金额均 right |
| 6 | scroll.x 防横向溢出 | ✅ PASS | 主表 `scroll.x=1600`，操作列 fixed right |
| 7 | 不像默认模板 | ✅ PASS | 5 KPI + 详情行业字段分区 + 子表合计行 |

### 发现 / 教训

- `Table.Summary.Cell` 不支持 `style` prop，必须用 `<span style={...}>` 包裹内容。
- 表格行内「生成发货」不能依赖全局 `detail` state；必须即时拉 `/orders/:id` 获取 items，否则未打开详情时会传空 items。
- 新建/编辑订单如果不在 `handleEdit` 中拉详情回填 `items`，保存会覆盖/丢失订单明细。
- 大弹窗应加 `styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}`，否则 browser_vision 只能看到上半部分，用户也不易滚动查看。

### 累计 P0 进展

| Page | 行数 | 业务闭环 | 状态 |
|------|------|---------|------|
| Purchases | 44→672 | ✅ 采购审批/出单/入库 | ✅ 完成 |
| Deliveries | 41→665 | ✅ 发货/签收 | ✅ 完成 |
| Orders | 140→596 | ✅ 详情/明细/状态/生成工单/生成发货 | ✅ 完成 |
| Receivables | 0（待建） | ❌ | ⏳ P0-4 |
| Payables | 0（待建） | ❌ | ⏳ P0-4 |

## 下一步 P0 阻塞

- [ ] P0-4: Receivables.tsx + Payables.tsx 2 个新 page（应收应付，旧版有，新版 0 个）

## 5 档投票

| 档 | 建议 |
|----|------|
| A | 继续 P0-4 Receivables + Payables 2 个新 page |
| B | 先做 P1 视觉打磨（Orders/Purchases/Deliveries 统一空值灰显、行 hover、批量操作）|
| C | 先全链路回归（Orders→WorkOrders→Purchases→Deliveries 浏览器 11 页）|
| D | 暂停，先同步正式服 |
| E | 暂停，等用户反馈 |


---

## P0-4 已修复：Receivables + Payables 新页面缺失（已完成）

### 现象
- 旧系统具备应收/应付财务跟踪能力，新版前端只有 `Finance.tsx` 39 行通用只读列表。
- 前端没有独立 `/receivables` 与 `/payables` 页面，菜单也没有入口。
- 后端 `finance_records` 已有完整基础能力：列表、详情、新建、更新、删除、结清、冲正、汇总，但前端未充分接入。

### 修复

新增/改造文件：

| 文件 | 说明 |
|------|------|
| `apps/web/src/pages/FinanceRecordsPage.tsx` | 应收/应付共用完整业务页（约 520 行） |
| `apps/web/src/pages/Receivables.tsx` | 应收页面配置封装 |
| `apps/web/src/pages/Payables.tsx` | 应付页面配置封装 |
| `apps/web/src/pages/Finance.tsx` | 从 39 行只读表改为财务总览 + 应收/应付入口 |
| `apps/web/src/App.tsx` | 新增 `/receivables` `/payables` 路由 |
| `apps/web/src/components/Layout.tsx` | 菜单新增「应收」「应付」，boss/finance 权限放行 |
| `apps/web/src/types/api.ts` | FinanceRecord interface 补全 15 字段 |
| `apps/web/src/utils/statusColor.ts` | 新增 未结清/已结清/已冲正 状态色 |

### 新页面能力

`/receivables` 应收管理：
- KPI 5 卡：总应收单 / 未结清 / 已结清 / 逾期 / 未结清金额
- 3 筛选：状态 / 账期 / 类别 + 搜索 + 清除筛选
- 12 列表格：单号、来源、客户、金额、状态、到期日、账期、类别、说明、结清时间、创建时间、操作
- 操作：详情 / 结清 / 冲正 / 编辑 / 删除
- 新建/编辑 Modal：关联单号、来源类型、客户、金额、状态、到期日、账期、类别、结清时间、说明
- 详情 Modal：15 字段 + 业务提示
- CSV 导出（带 BOM）

`/payables` 应付管理：
- 与应收同构，配置为供应商/委外商、采购货款/委外加工费/运费/工资/其他应付
- 支持空态 `TableEmptyCell`：无数据时显示「新建应付」按钮

`/finance` 财务总览：
- 4 KPI：应收总额 / 应付总额 / 收入 / 支出
- 应收/应付入口卡片
- 最近 8 条财务记录

### 接口细节

后端 controller 当前实际路径是 `@Controller('finance_records')`，但旧注释/旧前端曾写 `/finance-records`。
前端实现了双路径 fallback：
- 首选 `/api/finance_records`
- 失败后 fallback `/api/finance-records`

避免命名不一致导致财务页空白。

### 验证

- typecheck：`npx tsc --noEmit -p apps/web/tsconfig.json` → 0 errors
- AntD 图标审计：PASS
- vite build：7.61s
- nginx reload：OK
- 浏览器 `/receivables`：18 条应收加载；KPI 18/16/2/6/¥10,126.00；详情弹窗正常；新建弹窗字段完整，保存/取消 footer DOM 可见
- 浏览器 `/payables`：0 条应付加载；空态正常；新建应付弹窗字段完整，保存/取消 footer DOM 可见
- 浏览器 `/finance`：财务总览正常；应收总额 ¥10,157.00，应付总额 ¥0.00；入口按钮正常
- 浏览器 console：0 errors / 0 messages

### 设计标准（§04 七条 UI 验收）

| # | 检查项 | 结论 |
|---|--------|------|
| 1 | 品牌色一致 | ✅ PASS |
| 2 | 状态色映射 | ✅ PASS：未结清 orange / 已结清 green / 已冲正 red |
| 3 | 表格空态 | ✅ PASS：Payables 空态有新建按钮 |
| 4 | 操作按钮状态条件渲染 | ✅ PASS：已结清不显示结清，已冲正不显示编辑/冲正 |
| 5 | 数字列右对齐 | ✅ PASS：金额列 right + 加粗 |
| 6 | scroll.x 防横向溢出 | ✅ PASS：主表 `scroll.x=1700` |
| 7 | 不像默认模板 | ✅ PASS：KPI + 筛选 + 详情 + 业务提示 + 总览入口 |

### P0 总结

| Page | 原状态 | 新状态 |
|------|--------|--------|
| Purchases | 44 行只读 | ✅ 672 行完整采购闭环 |
| Deliveries | 41 行只读 | ✅ 665 行完整发货闭环 |
| Orders | 140 行缺详情/明细 | ✅ 596 行详情/明细/生成工单/发货 |
| Receivables | 不存在 | ✅ 新增完整应收管理 |
| Payables | 不存在 | ✅ 新增完整应付管理 |

P0 旧系统核心业务页复刻缺口：已全部补完。


---

## 全链路回归发现：P0 阻断为 0，P1 UI/数据展示待修（2026-06-10）

### 验证命令/方式

- 后端：浏览器登录态授权 GET `/api/products`、`/api/orders`、`/api/work_orders`、`/api/purchases`、`/api/deliveries`、`/api/finance_records` 等 15 个接口。
- 前端：浏览器逐页访问 12 个核心路由：`/`、`/products`、`/orders`、`/work_orders`、`/purchases`、`/outsourcing_orders`、`/warehouse`、`/deliveries`、`/reconciliation_bills`、`/finance`、`/receivables`、`/payables`。
- 视觉：browser_vision 检查 Orders/Purchases/Deliveries/Finance/Receivables/Payables。
- console：browser_console 0 errors / 0 messages。

完整报告：`docs/regression-report-2026-06-10-p0-pages.md`。

### 结论

- P0：0 个。无白屏、无接口 500、无页面崩溃、无 console exception。
- P1：6 个，集中在表格可读性与数据兜底。

### P1 待修

1. `/orders`：右侧金额/操作列视觉拥挤，疑似 fixed 操作列遮挡感。
2. `/purchases`：长采购单号换行断裂。
3. `/purchases`：待审批行操作按钮过多，视觉拥挤且存在误点风险。
4. `/deliveries`：客户/关联订单出现 `ID:null`，技术型兜底文案暴露给用户。
5. `/receivables`：到期日列宽不足，部分日期疑似截断。
6. `/receivables`：操作按钮拥挤，冲正/删除等危险操作建议收纳。

### 建议下一档

P1 修复优先级：先修 `/deliveries` 的 `ID:null` 和所有表格 `nowrap/Tooltip`，再把危险/低频操作收纳到「更多」。

---

## P1 回归问题修复（2026-06-10）

### 修复项

1. 发货管理 `ID:null`
   - 表格关联订单/客户兜底从 `ID:${id}` 改为 `未关联`。
   - 详情弹窗、CSV 导出同步改为友好兜底。
   - 验证：页面不再出现 `ID:null`。

2. 采购管理单号和操作列
   - 采购单号列加宽并使用 nowrap + Tooltip。
   - 操作列从 6~7 个按钮收纳为主操作 + `更多`。
   - 删除改为 Modal.confirm 二次确认，避免 Dropdown 中嵌套 Popconfirm 的交互不稳定。

3. 订单管理金额和操作列
   - 总金额/成本/利润列统一 nowrap。
   - 打印/删除收纳到 `更多`。

4. 应收/应付财务页
   - 单号列 nowrap + Tooltip。
   - 到期日列加宽到 130 并 nowrap。
   - 冲正/编辑/删除收纳到 `更多`。

### 验收

- `npx tsc --noEmit -p apps/web/tsconfig.json`：PASS
- `antd-icon-import-audit.py apps/web/src`：PASS
- `npx vite build`：PASS
- `nginx -t && nginx -s reload`：PASS
- 浏览器 console：0 errors / 0 messages
- browser_vision：采购 / 发货 / 应收 P1 修复 PASS

### 剩余 P2

- 发货管理待发货行仍有 5 个操作按钮，可后续同样收纳为 `详情 / 发货 / 更多`。
- 财务页 `更多` 菜单靠右边缘，窄屏时可再调 dropdown placement 或操作列 padding。

---

## P2 表格操作列打磨（2026-06-10，仅测试服）

### 背景

P1 修复后剩余 P2：

- 发货管理待发货行仍有 5 个操作按钮，行高/密度有继续优化空间。
- 财务页 `更多` 菜单靠近右边缘，窄屏时存在裁切风险。

### 修复

1. 发货管理操作列
   - 待发货：`详情 / 发货 / 更多`
   - 已发货：`详情 / 签收 / 更多`
   - 已签收：`详情 / 更多`
   - `更多` 包含打印；待发货额外包含编辑、删除。
   - 删除使用 `Modal.confirm`，避免 Dropdown 中嵌套 Popconfirm。

2. 财务页 Dropdown 边距
   - 操作列宽度 190 → 210。
   - Dropdown 设置 `placement=bottomRight`。
   - `更多` 按钮增加右侧 padding。

### 验收

- `npx tsc --noEmit -p apps/web/tsconfig.json`：PASS
- AntD 图标审计：PASS
- `npx vite build`：PASS
- 测试服部署：PASS（`/var/www/paperbox-erp/` + nginx reload）
- 发货管理 browser_vision：PASS，菜单 `打印/编辑/删除` 完整显示，未裁切
- 应收管理 browser_vision：PASS，菜单 `冲正/编辑/删除` 完整显示，右侧有留白
- 应付管理 browser_vision：PASS，空态/表头/新建入口正常
- 浏览器 console：0 errors / 0 messages

### 注意

- 本轮按用户要求仅部署测试服，未同步正式服。

---

## 交互验证 + P2/P3 展示差异扫描（2026-06-10 晚间）

### 背景

A：逐按钮交互验证（测试服）
C：继续查旧系统 P2/P3 展示差异

### A 交互验证结果

| 页面 | 安全操作 | 危险操作 |
|------|----------|----------|
| 发货管理 | 7/7 PASS | — |
| 订单管理 | 5/5 PASS | 工单/发货 直接 POST（跳过） |
| 采购管理 | 5/5 PASS | 审批/入库 直接 POST（跳过） |
| 应收管理 | 5/5 PASS | 结清 直接 PUT（跳过） |
| 应付管理 | 2/2 PASS | — |

### QA 发现

| # | 问题 | 严重性 |
|---|------|--------|
| QA-1 | 订单工单/发货直接 POST 无确认 | Medium |
| QA-2 | 采购审批/入库直接 POST 无确认 | Medium |
| QA-3 | 应收结清直接 PUT 无确认 | Medium |
| QA-4 | 订单客户列 ID:${id} 兜底 | Low |
| QA-5 | 订单业务员列 ID:${id} 兜底 | Low |
| QA-6 | 应收详情标题不一致 | Low |

### C P2/P3 差异扫描

- 高价值 P2：Products > Dashboard > WorkOrders > OutsourcingOrders > Customers
- P3：ActionLogs/GlobalSearch/Guide/ImageLibrary
- 详见 `p2-p3-display-gap-audit-2026-06-10.md`

### 验收

- browser_console：0 errors
- 仅测试服，未同步正式服

---

## QA 确认弹窗修复（2026-06-10 晚间）

### 背景

交互验证发现 3 个 Medium 级问题：订单工单/发货、采购审批/入库、应收结清均为直接 POST/PUT，无确认弹窗。

### 修复

- 订单 `handleGenerateWorkOrder` / `handleGenerateDelivery`：按钮 onClick 改为 `Modal.confirm({ onOk: () => ... })`
- 采购 `handleApprove(r, true)` / `handleReceive`：同上
- 应收 `handleSettle`：同上
- 订单客户列 `ID:${id}` → `未关联`

### 验收

- tsc / 图标审计 / vite build / nginx reload：PASS
- 浏览器 5 个确认弹窗：全部 PASS
- console 0 errors

### 注意

- 驳回（handleApprove false）和取消（handleCancel）已有自己的 Modal.confirm，无需改动
- 冲正（handleCancelRecord）使用 window.prompt，无需改动
- 删除已在 Dropdown menu onClick 中使用 Modal.confirm

---

## P2 Dashboard + Products 差异补齐（2026-06-10 晚间）

### 背景

P2 展示差异扫描发现 Dashboard 和 Products 是差异最大的两个页面。

### Dashboard 改动

- 68→127 行
- 新增：本月收入/利润 KPI + 最近送货表 + 库存预警表
- 客户名用 customerMap 从 customers API 获取，兜底"未关联"
- 签收状态用 signed_at 有值→已签收/无值→未签收

### Products 改动

- 217→402 行
- 表格 11→17 列（新增盒型/产品类型/成品规格/含税价/不含税价）
- 新增详情弹窗 800px，4 个 Descriptions 区域覆盖 Product entity 全部 30+ 字段
- 详情弹窗底部打印按钮
- 操作列：详情 / 编辑 / 删除

### 验收

- tsc / 图标审计 / vite build / nginx reload：PASS
- Dashboard：6 KPI + 3 表格正常
- Products：17 列 + 详情弹窗 4 区域正常
- console 0 errors

### 注意

- 旧系统 Dashboard 还有全局搜索框（跨模块搜索），新版暂未补（需要新 API）
- 旧系统 Products 还有印件管理/刀模管理/客户产品编码等弹窗，属于更深层功能增强

---

## P2 WorkOrders / OutsourcingOrders / Customers 差异补齐（2026-06-10 晚间）

### 背景

P2 展示差异扫描发现 3 个核心业务页差异仍大，继续补齐。

### WorkOrders 改动

- 196→512 行
- 18 列含「完成进度」Progress +「已发/待发数量」+「进仓码」+可复制「工单号」
- 详情 Modal 4 区域 + 打印按钮
- 全部危险操作用 Modal.confirm 包裹

### OutsourcingOrders 改动

- 195→250 行
- 19 列含工单号/客户/完成数/已收货/上机尺寸/上机数量/尺寸结构/印刷颜色/计划日期
- 详情 Modal 4 区域 + 打印按钮
- 客户名从 customers API 获取

### Customers 改动

- 101→200 行
- 13 列含账期(天)/结算方式/含税Tag/返点/信用额度/状态
- 详情 Modal 基本信息/财务信息 2 区域
- 新建/编辑 Modal 800px，加状态/账期(天)/结算方式/含税Switch/信用额度
- 删除改 Modal.confirm
- types/api.ts Customer 加 4 字段：payment_days/settlement_type/credit_limit/payment_cycle 类型修正

### 验收

- tsc / 图标审计 / vite build / nginx reload：PASS
- 3 页面表格全部正常
- console 0 errors

### 注意

- WorkOrders 后端 /api/print/work_order/:id 端点不存在，前端按需求实现打开逻辑，后续需后端补端点
- 旧版 Customers 还有"添加材料类型"按钮（基础资料弹窗），新版未补

---

## P2 整页缺失 + Finance 增强（2026-06-10 晚间）

### 新建 3 整页

- Settings.tsx（505 行）：配置管理 + 常用配置快捷区 + boss 权限
- ActionLogs.tsx（541 行）：日志查询/筛选/导出/清空
- GlobalSearch.tsx（651 行）：跨 6 模块并行搜索 + Tabs 分组

### 增强 Finance / FinanceRecordsPage

- Finance 118→280 行：月度汇总 12 行 + 类别分布
- FinanceRecordsPage 438→505 行：来源类型列 + 详情来源明细

### 路由与菜单

- App.tsx：3 个新路由
- Layout.tsx：3 个新菜单项 + boss 权限

### 验收

- tsc / 图标审计 / vite build / nginx reload：PASS
- 4 页面浏览器验证全部正常
- console 0 errors

### 后续

- Settings 后端只有 3 字段（id/key/value），如要支持分组、描述等需后端 schema 升级
- GlobalSearch 是客户端全量模糊匹配，未做后端全文索引；大数据量时性能可能下降

