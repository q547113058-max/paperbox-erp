# ERP 新系统优化实施计划

> 基于易纸箱系统（zxcerp.djcps.com）和钉钉操作手册的对比分析

**目标：** 参考行业标杆系统，逐阶段增强新ERP的数据分析能力和业务覆盖度

---

## 参考源分析结论

### 易纸箱核心优势
1. **首页仪表盘**：采购/订单/毛利/送货/客户账款多维度KPI + 环形图 + 材料采购排名 + 日/月/年切换
2. **应收账款**：按客户汇总视图（期初应收/合计应收/已收/优惠/剩余）+ 收款/开票快捷操作
3. **对账单**：汇总统计栏（总金额/已对账/未对账/未回款/逾期）
4. **订单管理**：20+工序追踪列 + 工作流按钮 + Tab分类
5. **仓库管理**：7个子模块（定制/通用/纸板/库区/印版/刀模/辅料）
6. **生产管理**：5个子模块（待安排/待完工/计划/工单/计件）

---

## 阶段一：Dashboard仪表盘增强 (P0)

### 1.1 后端：增强 Report API

**文件：** `apps/server/src/report/report.service.ts`

新增方法：
- `getDashboardData(date?)` — 返回完整仪表盘数据
  - 采购金额、采购面积（由 purchases 表聚合）
  - 订单金额、订单面积、毛利
  - 送货金额、送货数量
  - 客户账款：总欠款、应收、欠款家数、应收家数
  - 材料采购排名 Top 5
  - 当月收款（环形图数据）
  - 环比/同比百分比

**文件：** `apps/server/src/report/report.controller.ts`

新增端点：
- `GET /reports/dashboard?date=2026-06` — 仪表盘聚合数据

### 1.2 前端：重写 Dashboard 页面

**文件：** `apps/web/src/pages/Dashboard.tsx`

从简单指标卡片升级为：

```tsx
布局：
Row 1: 时间筛选（日/月/年）+ 日期选择器
Row 2: 6 KPI 卡片（增强版）
  - 采购金额 + 采购面积 + 环比/同比
  - 订单金额 + 订单面积 + 环比/同比
  - 毛利（订单毛利 + 送货毛利）
  - 送货金额 + 送货数量
  - 客户账款（总欠款/应收/欠款家数/应收家数）
  - 低库存预警
Row 3: 三列布局
  Col 1 (50%): 材料采购排名表（排名+材料名+采购量+环比）
  Col 2 (25%): 环形图（当月收款）
  Col 2 (25%): 近期订单列表
Row 4: 图表区（标签切换：订单/送货/采购/毛利）
```

依赖：安装 `@ant-design/charts` 或使用 `recharts`

### 1.3 新增依赖

```bash
cd apps/web && npm install @ant-design/charts
# 或轻量方案：
cd apps/web && npm install recharts
```

---

## 阶段二：财务模块升级 (P1)

### 2.1 应收账款按客户汇总视图

**新增页面：** `apps/web/src/pages/AccountsReceivable.tsx`

基于参考系统，新增：
- 汇总统计栏：应收总额 / 已收总额 / 优惠总额 / 剩余应收
- 表格列：客户名称 / 期初应收(可编辑) / 合计应收 / 合计已收 / 收款记录链接 / 合计优惠 / 剩余应收 / 已开票金额
- 行操作：收款 / 开票 / 查看

**路由：** `/accounts_receivable`
**菜单：** 财务记录 → 应收账款

### 2.2 对账单汇总统计栏

**修改文件：** `apps/web/src/pages/ReconciliationBills.tsx`

在表格上方增加汇总栏：
- 总金额 / 已对账 / 未对账 / 未回款 / 逾期未回款

### 2.3 送货明细页

**新增页面：** `apps/web/src/pages/DeliveryDetails.tsx`

基于 DocumentListPage 组件，列表展示所有送货记录。

---

## 阶段三：生产模块补全 (P1)

### 3.1 工单列表

**新增页面：** `apps/web/src/pages/WorkOrderList.tsx`

基于 DocumentListPage，复用 `/work_orders` API。

### 3.2 生产计划/待安排/待完工

- 待安排订单：过滤 status='待安排' 的工单
- 待完工订单：过滤 status='生产中' 的工单
- 生产计划：按日期/机台排程视图

---

## 阶段四：仓库/库存增强 (P2)

### 4.1 分类库存管理

新增子菜单项：
- 纸板库存 — 材料库存（materials 表）
- 印版库存 — 印刷版管理（新建表 print_plates）
- 刀模库存 — 已有 knife_dies 页面
- 辅料库存 — 辅料管理（新建表 auxiliary_materials）

### 4.2 库区管理

新增页面管理仓库区域划分。

---

## 阶段五：订单流程增强 (P2)

### 5.1 售后管理

**新增页面/模块：** AfterSales

- 售后列表：售后单号、原订单号、客户、售后类型、状态、金额
- 售后操作：退货/换货/退款/补货

### 5.2 订单列表工序追踪列

在 OrderList 页面增加列：
- 待入库数量
- 已入库数量
- 当前库存
- 已送货数量

### 5.3 AI智能录单

参考易纸箱的"智能录单"功能，后续可通过 OCR 或 AI 识别录入。

---

## 阶段六：基础设置补全 (P2)

### 新增页面

| 路由 | 页面 | 说明 |
|------|------|------|
| `/pricing` | PricingSettings.tsx | 报价设置（材料单价/加工费/纸板价格公式） |
| `/machines` | MachineSettings.tsx | 机台设置（机台名称/类型/产能） |
| `/teams` | TeamManagement.tsx | 班组管理（班组名称/成员/组长） |

---

## 文件变更概要

### 后端
| 文件 | 操作 |
|------|------|
| `report.service.ts` | 修改：新增 getDashboardData |
| `report.controller.ts` | 修改：新增 dashboard 端点 |
| `app.module.ts` | 检查 imports |

### 前端
| 文件 | 操作 |
|------|------|
| `Dashboard.tsx` | 重写：全新仪表盘 |
| `Layout.tsx` | 修改：新增菜单项 + 权限 |
| `App.tsx` | 修改：新增路由 |
| `AccountsReceivable.tsx` | 新建 |
| `ReconciliationBills.tsx` | 修改：增加汇总栏 |
| `DeliveryDetails.tsx` | 新建 |
| `WorkOrderList.tsx` | 新建 |
| `OrderList.tsx` | 修改：增加工序列 |
| `package.json` | 修改：新增 charts 依赖 |

---

## 执行顺序

1. 后端 dashboard API → 前端 Dashboard 重写
2. 应收账款汇总视图
3. 对账单统计栏
4. 生产模块（工单列表）
5. 仓库分类库存
6. 订单增强（售后+工序列）
7. 基础设置补全
