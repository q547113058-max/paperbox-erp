# 2026-06-09 — phase 15: §04 美术合规 A+B 档（TableEmptyCell helper 推广 + dev/test 验证）

## 任务
用户在 §04 七条 UI 验收自审后选 A+B：
- **A** = TableEmptyCell helper 实际用上 + 加 `no-match` preset
- **B** = dev (localhost:5174) 双轨验证 + npm test

## 改动文件

### A. TableEmptyCell helper 升级 + 推广
**重写** `apps/web/src/components/TableEmptyCell.tsx`：
- 接收 `resource`（资源名） + `actionText` + `onAction` + `keyword` + `isDataEmpty` + `preset` + `hint` 7 个 prop
- **3 种 preset** 自动判断：
  - `forcePreset='minimal'` → 极简（无 CTA，用于 Warehouse 3 个子表）
  - `forcePreset='no-match'` → 强制无匹配
  - 默认（primary）→ 根据 `isDataEmpty` + `keyword` 自动选：
    - isDataEmpty=true → "未创建" preset（图标 + 描述 + 引导 + 主操作 CTA）
    - isDataEmpty=false 且 keyword 有值 → "无匹配" preset（搜索图标 + "无匹配" + 搜索词 + 调整建议，**无** CTA）
    - isDataEmpty=false 且 keyword 空 → 视作初始空态（同 primary）
- 解 phase 13 P3 finding：搜索无结果时显示"没有找到匹配的 X"而非"还没有 X"

**推广 14 个业务页 + 1 个子表**（15 处 TableEmpty JSX 全部从 `<TableEmpty preset="primary" ... />` 改为 `<TableEmptyCell resource="X" actionText="Y" onAction={...} keyword={keyword} isDataEmpty={...} />`）：
- 12 个 CRUD 页：Orders/Customers/Personnel/Suppliers/Products/ColorPrints/Deliveries/Finance/KnifeDies/OutsourcingOrders/Purchases/ReconciliationBills/WorkOrders
- Warehouse 3 个子表用 preset="minimal" 模式（无 CTA，因为不能从子表直接创建）
- 修复 bug：ColorPrints 的 data 变量名实际叫 `prints`，之前我用 `data` 引用导致 TS 错误

### B. dev + test + lint 验证
| 命令 | 结果 |
|---|---|
| `npx tsc --noEmit -p apps/web/tsconfig.json` | exit 0, 0 errors |
| `npx vite build` | ✓ built in 7.50s |
| `npm run typecheck` | exit 0（后端 tsc） |
| `npm test` | exit 0, 2 suites / 15 tests passed |
| `npm run lint` | exit 0, 0 errors, 121 warnings（any 警告，与本次美术债无关） |
| `npx vite --host 0.0.0.0 --port 5174` dev 站 | VITE v5.4.21 ready in 218ms, HTTP 200, main.tsx/App.tsx/TableEmptyCell.tsx 都能编译 |

dev 双轨验证：curl 验证 3 个关键源文件 `/src/main.tsx` `/src/App.tsx` `/src/components/TableEmptyCell.tsx` 都返回 HTTP 200（Vite 编译无错）。

**前端**无测试框架（jest.config.js 只覆盖后端）—— 不强行装 vitest，遵守"不破坏既有测试"原则。

## 验证

| 项 | 方法 | 结果 |
|---|---|---|
| TypeScript typecheck (web) | `npx tsc --noEmit -p apps/web/tsconfig.json` | exit 0, 0 errors |
| TypeScript typecheck (server) | `npm run typecheck` | exit 0 |
| Vite build (prod) | `rm -rf dist && npx vite build` | ✓ built in 7.50s |
| 部署 | `bash scripts/deploy-frontend.sh` | nginx reload OK |
| Vite dev | `npx vite --host 0.0.0.0 --port 5174` | 200 OK, 3 个源文件可编译 |
| 后端单测 | `npm test` | 15/15 passed |
| Lint | `npm run lint` | 0 errors |
| 浏览器 - 搜索无结果 no-match preset | 注入无匹配搜索 + browser_vision | 4/4 PASS：搜索图标 + "没有找到匹配的 X" + 搜索词高亮 + 调整建议 + 无"新建"CTA |

## 质量等级
**A+**

## 5 档后续投票
- **A**（推荐）→ git commit 前端美术债 + 等用户授权推正式服（按用户工作偏好"未授权不写新版"）
- B → 给前端加 vitest + 写 TableEmptyCell unit test（需新依赖，超出"不破坏既有测试"边界）
- C → 关闭 phase 15 收尾，等下次美术抛光会话
- D → 暂不修
- E → 其他
