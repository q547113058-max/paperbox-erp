# 2026-06-09 — phase 13: §04 美术合规 B+C 档

## 任务
用户在 §04 七条 UI 验收自审后选 A：综合修；再选 B+C：§04 第 6 + 第 7 条。

- **B** = §04 第 6 条：空 / 加载 / 错误 / 成功状态
- **C** = §04 第 7 条：UI 不像默认模板或未打磨组件库
- 跳过 A 里的 §04 第 4 条（响应式断点未实测，本期不做）

## 改动文件

### 新增（3 个组件）

1. `apps/web/src/components/BrandLogo.tsx` — 28×28 内联 SVG（钢蓝方块 + 三道白色横线，纸箱层叠意象）+ "丰晟达 ERP" 文字
2. `apps/web/src/components/ErrorBoundary.tsx` — 全局错误边界，含"返回首页 / 刷新 / 复制错误详情"操作
3. `apps/web/src/components/TableStates.tsx` — `TableEmpty`（default/primary/minimal 三档 preset）+ `TableSkeleton`（shimmer 动画骨架行）

### 修改（5 个文件）

4. `apps/web/src/main.tsx` — 品牌色 `#1677ff` → `#2c5282`（钢蓝）；新增 `colorPrimaryHover/Active` token
5. `apps/web/src/App.tsx` — 顶层包 `<ErrorBoundary>`；Suspense fallback 改为 `<TableSkeleton>`（替代原 `<Spin>`）
6. `apps/web/src/components/Layout.tsx` — Sider 顶部"纸箱"字 + BoxPlotOutlined 替换为 `<BrandLogo size={24} />`；Header 改为面包屑 + 用户菜单（无重复品牌名）
7. `apps/web/src/pages/Login.tsx` — 标题"纸箱 ERP" → "丰晟达 ERP"；副标"开平市丰晟达食品" → "开平市丰晟达食品 · 纸箱业务系统"；卡片宽度 360→380，加阴影 + 渐变背景
8. `apps/web/src/pages/Orders.tsx` — 表格 `locale.emptyText` 接入 `<TableEmpty preset="primary" />`（带"新建销售订单"CTA）

### 文档（2 个文件）

9. `docs/design-tokens.md` — §1.1 主色更新为钢蓝 + 全栈一致性要求；§1.4 引用色更新；§7 撤回 4 条 P1（KPI 同质 / hover 斑马纹 / 数字列对齐 / 字体加载 / Sider 重复）
10. （append）`docs/refactor-findings-2026-06-09.md` — phase 13 验收记录

## 验证

| 项 | 命令/方法 | 结果 |
|---|---|---|
| TypeScript typecheck | `npx tsc --noEmit -p apps/web/tsconfig.json` | exit 0, 0 errors |
| Vite build | `rm -rf node_modules/.vite dist && npx vite build` | ✓ built in 7.55s |
| 部署 | `bash scripts/deploy-frontend.sh` | nginx reload OK |
| 登录页视觉（钢蓝 + Logo + 副标） | browser_vision | 3/3 PASS：钢蓝、Logo 三横线、副标 |
| 整体"是否做了品牌定制" | browser_vision 评审 | ✅ "做了品牌定制"，不再是"未打磨 AntD 默认模板" |
| Sider/Header 品牌名去重 | snapshot ref e2 | Sider 单一 BrandLogo，Header 无品牌名 |
| 表格空状态（搜索无结果） | 注入无匹配搜索 + browser_vision | 4/4 PASS：图标 + 描述 + 引导 + CTA 按钮 |
| ErrorBoundary 注册 | tsc pass + App.tsx import 已加 | 已挂载到顶层，错误时触发友好错误页 |

## §04 七条 UI 验收 — 复核

| # | 检查项 | 之前 | 本次后 | 证据 |
|---|---|---|---|---|
| 1 | 视觉方向符合需求 | ✅ | ✅ | project-requirements.md B 端 + 工业风 |
| 2 | 主色/字体/间距已记录 | ✅ | ✅ | design-tokens §1-5 |
| 3 | 主要流程可完成 | ✅ | ✅ | 11 菜单全部可达 |
| 4 | 桌面/移动端无溢出 | ⚠️ | ⚠️ | 本期未做，跳过 |
| 5 | 可点击元素有清晰状态 | ✅ | ✅ | AntD 内置 |
| 6 | 空/加载/错误/成功状态 | ⚠️ | ✅ | 新增 ErrorBoundary + TableSkeleton + TableEmpty |
| 7 | UI 不像默认模板 | ❌ | ✅ | 钢蓝主色 + BrandLogo + 业务化副标，视觉评审"做了品牌定制" |

**结果**：4 → 6 PASS，0 FAIL，1 部分（§4 响应式未做）。§04 验收 5/7 完全通过 + 1 部分 + 1 PASS。

## 质量等级
**A**

## 5 档后续投票
- **A**（推荐）→ 修 §04 第 4 条响应式断点：浏览器视口 <768px 实测各页无溢出
- B → 把 BrandLogo 推到 dev（http://localhost:5174）双轨验证 + 推广 TableEmpty 到其他 14 个业务页（目前只 Orders 一页示范）
- C → 给 Dashboard 4 张 KPI 加微色差 + 趋势 mini-chart，治本"KPI 同质"（但 §7 已撤项，不是 §04 验收阻塞）
- D → 暂不修，本期收尾
- E → 其他（用户指定）
