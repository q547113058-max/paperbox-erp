# Dev Log — 2026-06-09 (Phase 6: 状态色映射统一)

## 摘要

B 档投票完成：**状态色映射统一**（design-tokens.md §1.3 落地）。

- 新建 `utils/statusColor.ts`：统一 getStatusColor() 工具函数
- 覆盖 24 种业务状态，按 6 色系分类（orange/blue/processing/green/red/default）
- 应用到全部 11 个 page，删除 8 处重复的 STATUS_COLOR map

## 新建文件

- `apps/web/src/utils/statusColor.ts` (2.6 KB)
  - `getStatusColor(status)` → AntD Tag color
  - `getStatusDot(status)` → hex 色值（供非 Tag 场景用）
  - 覆盖 24 种状态

## 修改文件（11 个 page）

每个 page：删除本地 STATUS_COLOR map + `import { getStatusColor }` + render 改用 `getStatusColor(s)`

| 文件 | 之前 | 之后 |
|------|------|------|
| Orders.tsx | 6 种状态 map | getStatusColor |
| Purchases.tsx | 6 种状态 map | getStatusColor |
| Deliveries.tsx | 5 种状态 map | getStatusColor |
| WorkOrders.tsx | 5 种状态 map | getStatusColor |
| OutsourcingOrders.tsx | 3 种状态 map | getStatusColor |
| ReconciliationBills.tsx | 3 种状态 map + detail.bill.status 两处 | getStatusColor |
| Warehouse.tsx | ENTRY_STATUS_COLOR + INV_STATUS_COLOR 两个 map | getStatusColor |
| Products.tsx | `<Tag>{v \|\| '正常生产'}</Tag>` 无色 | getStatusColor |
| Customers.tsx | `v === '活跃' ? 'green' : 'default'` 内联 | getStatusColor |
| Personnel.tsx | 3 种状态 map | getStatusColor |
| Suppliers.tsx | `v === '合作中' ? 'green' : 'default'` 内联 | getStatusColor |

## 质量门禁

| 检查 | 结果 |
|------|------|
| vite build | ✅ EXIT 0（statusColor 独立 chunk 29 KB） |
| 浏览器截图 | ✅ 状态色正确区分 |

## 状态色对照（设计 → 实现）

| 色系 | AntD 色 | 含义 | 业务状态 |
|------|---------|------|------|
| 🟠 orange | 警告 | 需要行动 | 待确认/待审批/待加工/待发货/缺货/休假/锁定 |
| 🔵 blue | 进行中 | 系统已推进 | 已确认/已审批/已排产 |
| 🔵 processing | 生产中 | 持续操作 | 生产中/加工中 |
| 🟢 green | 完成 | 终态/健康 | 已完成/已签收/已入库/已确认/正常生产/合作中/活跃/在职/可用 |
| 🔴 red | 异常 | 终态异常 | 已取消/已驳回/已失效/停售 |
| ⚪ default | 中性 | 未激活 | 待排产/待出单/已出单/已用完/离职/停用 |

## 验证截图

- Orders：第一行"已确认"=蓝色 Tag，其他"待确认"=橙色 Tag ✅
- WorkOrders："已完成"=绿色 Tag，"待排产"=灰色 Tag ✅

## 踩坑

### hermes_tools.read_file 返回带行号内容

`hermes_tools.read_file()` 返回的 content 包含 `1|import...` 行号前缀（和 CLI 的 `read_file` 工具格式一致），**不能直接写回文件**。脚本里用 `open(path).read()` 读文件内容才安全。

这次 11 个文件被污染了行号前缀（如 `1|import React...`），导致 vite build 报 `Expected "(" but found "React"`。修复：正则 `^\s*\d+\|` 清除行号前缀。

**教训**：hermes_tools.read_file 和 CLI read_file 不同，前者返回 `{content, total_lines}` dict，后者返回带行号的字符串。脚本里统一用 `open(path).read()`。

## 当前会话质量等级

Phase 6 完成后：**A**
- 全部 11 个 page 状态色统一
- 8 处重复 map 消除
- statusColor.ts 成为公共依赖（自动 code-split）

## 后续 5 档投票

| 档位 | 建议 |
|------|------|
| **A** | **Dashboard KPI 卡片差异化（图标/微色差/趋势对比）— 推荐** |
| B | 字体加载（Google Fonts link）+ 表格右对齐补全 |
| C | Sider Logo 重设计（去掉 Header 品牌名重复） |
| D | 部署正式服 |
| E | 暂停等反馈 |

**当前推荐**：A → B → C