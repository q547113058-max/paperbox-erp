# Dev Log — 2026-06-09 (Phase 8: 字体加载 + 表格对齐)

## 摘要

A 档投票完成：**字体加载 + 表格对齐**。

- Google Fonts link 已在 index.html（第7-13行），无需修改
- 表格列右对齐补全：9 个 page 的金额/数量/库存/单价/利润列加 `align: 'right' as const`
- 表格列居中补全：8 个 page 的状态列加 `align: 'center' as const`

## 修改文件

| 文件 | 改动 |
|------|------|
| Dashboard.tsx | 金额列右对齐 |
| Finance.tsx | 金额列右对齐 |
| Orders.tsx | 金额/成本/利润列右对齐 |
| OutsourcingOrders.tsx | 数量/单价列右对齐 |
| Products.tsx | 单价/库存/安全库存列右对齐 + 状态列居中 |
| Purchases.tsx | 金额列右对齐 |
| ReconciliationBills.tsx | 金额/数量列右对齐 + 状态列居中 |
| Warehouse.tsx | 数量列右对齐 + 状态列居中 |
| WorkOrders.tsx | 数量列右对齐 |
| Customers.tsx | 状态列居中 |
| Deliveries.tsx | 状态列居中 |
| Personnel.tsx | 状态列居中 |
| Suppliers.tsx | 状态列居中 |

## 质量门禁

| 检查 | 结果 |
|------|------|
| vite build | ✅ EXIT 0 |
| 浏览器截图 | ✅ 金额列右对齐 + 状态列居中 + 整体排版整齐 |

## 踩坑

### 脚本写入重复 align 行

批量加 `align: 'right' as const` 时，脚本逻辑在某些文件中插入了重复的 align 行（如 Products.tsx 的"单价"列），导致 vite build 报 `Expected "]" but found ":"`。

**根因**：脚本先检查"是否已有 align"再插入，但检查逻辑只看后续 5 行，而某些列的 render 行距离 title 超过 5 行。

**修复**：用 `sed -i 'Nd'` 删掉孤立的 align 行 + `sed -i "s/,,/,/g"` 修双逗号。

**教训**：批量修改列定义时，应改完后立即 `grep -n "align:"` 检查每个文件，而非等 build 报错。

## 后续 5 档投票

| 档位 | 建议 |
|------|------|
| A | Sider Logo 重设计（去掉 Header 品牌名重复） |
| B | 部署正式服 |
| C | 暂停等反馈 |
| D | 其他（用户指定） |