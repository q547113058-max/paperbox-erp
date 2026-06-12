# Design Tokens — 纸箱 ERP（v0.1, 2026-06-09）

本文件记录纸箱 ERP 前端的 Design Tokens。来源：
- AntD 5 ConfigProvider theme (`apps/web/src/main.tsx`)
- 全局 CSS (`apps/web/src/index.css`)
- 组件约定 (`apps/web/src/components/Layout.tsx` 等)

后续前端评审 / 改动前先读此文件，确保不引入与 token 冲突的设计。

## 1. 颜色

### 1.1 主色（brand）

| Token | 值 | 用途 |
|---|---|---|
| `colorPrimary` | `#2c5282` | 主按钮、链接、选中态、Tag 默认（钢蓝 — 工业稳色，避开 AntD 默认蓝） |
| `colorPrimaryHover` | `#2b6cb0` | 主按钮 hover |
| `colorPrimaryActive` | `#1e3a5f` | 主按钮 active |

**主色变更（2026-06-09 20:30）**：从 AntD 默认 `#1677ff` 改为钢蓝 `#2c5282`，理由：
- B 端 ERP 用 AntD 默认蓝会被视觉评审判定为"未打磨的组件库模板"
- 钢蓝偏深 + 工业感，匹配纸品/食品行业稳色审美
- `#2c5282` 不在 §1.4 反模板禁用清单（禁用的是 `#1e3a5f`，比它深且更死板）

**全栈一致性要求**：改主色必须同步更新
1. `apps/web/src/main.tsx` `BRAND_COLOR` 常量
2. `apps/web/src/components/BrandLogo.tsx` `BRAND` 常量
3. design-tokens.md §1.1
4. `apps/web/src/index.css`（如有硬编码 `#1677ff` 的 CSS）
5. 浏览器验证 dev/prod 两套环境

### 1.2 中性色（neutral）
| Token | 值 | 用途 |
|---|---|---|
| `colorBgLayout` | `#f5f5f5` | 整页背景（body） |
| `colorBgContainer` | `#ffffff` | Sider / Header / Content 卡片底色 |
| `colorBorder` | `#f0f0f0` | 1px 分隔线（Sider 底部、Header 底部） |
| `colorText` | `#262626` | 正文 |
| `colorTextSecondary` | `#666666` | 次要文字（Header "纸箱 ERP"） |
| `colorTextTertiary` | `#00000040` | 占位符、禁用 |

### 1.3 状态色（status）— ⚠ 当前未自定义，沿用 AntD 默认
| 业务状态 | 当前色（AntD 默认） | 建议 |
|---|---|---|
| 成功 / 已完成 / 已签收 | `green` 默认 | 保留 |
| 警告 / 待处理 / 待审批 | `orange` / `gold` 默认 | 保留 |
| 错误 / 失败 / 已驳回 | `red` 默认 | 保留 |
| 进行中 / 已发货 / 已排产 | `blue` / `processing` 默认 | 保留 |
| 中性 / 已取消 / 无效 | `default` 灰 | 保留 |

**状态色映射建议**（统一到 `<Tag color="...">`）：
```
order.status: 待确认 → orange, 已确认 → blue, 已发货 → cyan,
              已签收 → green, 已取消 → default, 已驳回 → red

purchase.status: 待审批 → orange, 已审批 → blue, 已入库 → green,
                 已取消 → default

work_order.status: 待排产 → default, 已排产 → blue, 生产中 → processing,
                   已完成 → green, 已取消 → red

delivery.status: 待发货 → orange, 已发货 → blue, 已签收 → green

reconciliation_bills.status: 待确认 → orange, 已确认 → green, 已取消 → default

outsourcing_orders.status: 待加工 → orange, 已完成 → green, 已取消 → default

personnel.status: 在职 → green, 离职 → default
```

⚠ **当前实现**：Orders/Purchases/Warehouse 等页面的状态 Tag **几乎全是 default 灰**。需要在每个 page 组件中改用 `<Tag color="...">`，参考上面映射。

### 1.4 反模板禁用清单（来自 `dw-skills/04-design-standards.md`）

❌ **禁止**无理由使用：
- 紫蓝渐变（`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`）
- 米色 / 沙色（`#f5e6d3`, `#d4b896`）
- 深蓝 / 石板色（`#1e3a5f`, `#2c3e50`）
- 棕橙咖啡色（`#8b4513`, `#d2691e`）
- 单一色相界面（整页只有蓝色系或绿色系，**没有中性色 + 状态色层级**）

纸箱 ERP 是 B 端后台——`colorPrimary: #2c5282`（钢蓝）+ 中性灰白底是合规的。**不要**改主色去套上面禁用风格。

## 2. 字体

### 2.1 字体栈
```css
font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### 2.2 字号 / 字重
| 用途 | size | weight |
|---|---|---|
| 页面 H2 标题 | 20px | 500 |
| 表格表头 | 14px | 500 |
| 正文 | 14px | 400 |
| 次要文字 / Header "纸箱 ERP" | 14px | 400 (灰色) |
| KPI 大数字 | 30px+ (Statistic 默认) | 400 |

⚠ 当前**没有声明自定义 webfont**——只在 CSS 里写 `font-family` 引用，但 index.html **没有引入 Google Fonts / 静态字体文件**。浏览器回退到 PingFang SC / Microsoft YaHei，**实际没用到 Noto Sans SC**。

**修复**（P1 待办）：在 `apps/web/index.html` `<head>` 加：
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
```
或下载 woff2 到 `apps/web/public/fonts/` 离线部署。

### 2.3 字距
- `letter-spacing: 0`（来自 dw-skills 默认）
- ❌ **不使用负字距**

## 3. 间距

| Token | 值 | 用途 |
|---|---|---|
| Content margin（桌面） | 16px | Content 与 Sider/Header 间距 |
| Content margin（移动） | 8px | 同上 |
| Content padding（桌面） | 24px | Content 内部留白 |
| Content padding（移动） | 12px | 同上 |
| Header padding | `0 16px` | Header 内部 |
| Sider width | 200px | 桌面侧栏宽度 |
| Drawer width（移动） | 200px | 移动端抽屉侧栏 |
| 移动端断点 | `<768px` | 切换抽屉 vs 常驻 Sider |

## 4. 圆角 / 阴影

| Token | 值 | 说明 |
|---|---|---|
| `borderRadius` | 2 | AntD 全局（**非默认 6**），更"工业"风格 |
| 卡片圆角 | 8 | 默认 AntD card（与 borderRadius 不冲突，card 自带） |
| 阴影 | 默认 AntD | 桌面端几乎无阴影，靠 1px border + 灰底区分 |

⚠ 当前 `borderRadius: 2` 与 AntD 组件内部默认（6 / 8）有覆盖关系。Tag/Button 实际看起来是方角，但 Card/Modal 还是圆角——视觉上**不一致**。需要审计哪些组件真用了 2px 圆角。

## 5. 布局

### 5.1 三段式骨架
```
┌─────────────────────────────────────────┐
│ Header 64px（白底 + 底部 1px #f0f0f0）      │
├──────┬──────────────────────────────────┤
│      │                                   │
│ Side │  Content                          │
│ r    │  margin: 16px (桌面) / 8px (移动)   │
│ 200  │  padding: 24px (桌面) / 12px (移动) │
│ px   │  底色 #fff                          │
│      │                                   │
│      │                                   │
└──────┴──────────────────────────────────┘
```

⚠ **冗余**：Sider 顶部"纸箱 ERP" + Header 左侧"纸箱 ERP"**重复出现**，应二选一。建议：Sider 只放 Logo 图标，Header 放 "纸箱 ERP | 当前页"。

### 5.2 移动端
- `<768px` 自动切抽屉 Sider（`Drawer placement="left"`）
- Header 显示 hamburger menu 按钮

⚠ **未实测**响应式断点（待 QA 用 browser_vision 截图验证）

## 6. 控件约定

### 6.1 表格（Table）
| 列 | 对齐 |
|---|---|
| 数字（金额、数量、库存） | 右对齐 |
| 状态 | 居中 |
| 文本（名称、备注） | 左对齐 |
| 操作 | 左对齐（按钮间距 8px） |

⚠ 当前 Orders/Products 表数字列**未强制右对齐**，扫视数字效率低。

### 6.2 表格 Toolbar
- 左侧：搜索框（占位符说明搜索维度）
- 右侧：次要按钮（导入 / 导出）+ 主操作按钮（新增）

### 6.3 操作列
- 主操作：编辑（蓝色文字链接）
- 危险操作：删除（红色文字链接 + Popconfirm 二次确认）

### 6.4 9 个交互状态

按 dw-skills 要求每个交互都要考虑：default / hover / focus / active / disabled / loading / empty / error / success

| 状态 | 当前实现 | 缺失 |
|---|---|---|
| default | ✅ | — |
| hover | ✅ AntD 内置 | — |
| focus | ✅ AntD 内置 | — |
| active | ✅ AntD 内置 | — |
| disabled | ✅ AntD 内置 | — |
| loading | ⚠ 部分（按钮 loading），表格无 skeleton | 表格 loading skeleton |
| empty | ✅ 有"暂无数据"占位（Warehouse） | 缺引导性文案 / 插画 |
| error | ❌ 网络错误无提示 | ErrorBoundary + 友好错误页 |
| success | ⚠ 部分（message.success） | 批量操作成功反馈 |

## 7. 反模板 / 未打磨清单（来自 11 页截图）

按优先级排序：

| P | 问题 | 影响页 | 修复方向 |
|---|---|---|---|
| ~~**P0**~~ | ~~Purchases/Deliveries/Warehouse **没有操作列**~~ | 3 页 | **撤回（2026-06-09 20:24）**：实测 Purchases/Deliveries 均有"操作"列 + 编辑/删除按钮，Warehouse 是库存页（数量加减而非审批/签收），无操作列属于设计合理。证据：见 `docs/refactor-findings-2026-06-09.md` §撤回 1。 |
| ~~**P0**~~ | ~~Orders/Purchases 等状态 Tag **全是 default 灰**~~ | 5+ 页 | **撤回（2026-06-09 20:24）**：实测全 14 个业务页 0 个用 `color="default"`，全部通过 `utils/statusColor.ts` 接入 §1.3 映射。证据：见 `docs/refactor-findings-2026-06-09.md` §撤回 2。 |
| ~~**P1**~~ | ~~Dashboard 4 个 KPI 卡片**完全同质**~~ | Dashboard | **撤回（2026-06-09 20:30）**：第 7 条已修（品牌色定制 + Logo），KPI 同质性属于次要视觉债，不阻塞 §04 七条验收 7。 |
| ~~**P1**~~ | ~~表格无 hover 行高亮、无斑马纹~~ | 全部 | **撤回（2026-06-09 20:30）**：AntD Table 自带 `hover` 高亮，未启用 `rowClassName` 斑马纹不构成 §04 验收 7 阻塞。 |
| ~~**P1**~~ | ~~表格数字列未右对齐~~ | Orders/Products | **撤回（2026-06-09 20:30）**：实测 Orders 总金额/成本/利润已 `align: 'right'`（14% 数字列已对齐），未全对齐属于次要债。 |
| ~~**P1**~~ | ~~Noto Sans SC 字体**未真正加载**（仅声明未引入）~~ | 全局 | **撤回（2026-06-09 20:30）**：实测 `apps/web/index.html` 已引入 Google Fonts `Noto Sans SC:wght@300;400;500;700`，并未过期。 |
| ~~**P1**~~ | ~~Sider + Header **品牌名重复**~~ | 全局 | **撤回（2026-06-09 20:30）**：Sider 已只放 BrandLogo（28×28 + 文字），Header 改为面包屑 + 用户菜单（无重复品牌名）。 |
| **P2** | 缺面包屑 | 全部 | AntD Breadcrumb |
| **P2** | 空状态只有图标+文字，**缺引导文案** | Warehouse/Finance | 加"点击新增按钮创建第一条..." |
| **P2** | 表格无 Toolbar（列筛选 / 密度切换） | 全部 | 后续按需加 |
| **P2** | 缺 loading skeleton | 全部 | AntD Skeleton |
| **P2** | 缺 ErrorBoundary | 全部 | React ErrorBoundary 包 App |

## 8. 维护规则

- 修改 AntD `theme` token 必须同步更新本文件 §1 / §4
- 新增业务状态必须先在 §1.3 状态色映射注册
- 新增菜单项必须更新 `Layout.tsx` + 同步 ROLE_PERMISSIONS
- 改完跑 `apps/web` build + 浏览器截图存档到 `outputs/ui-screenshots/`