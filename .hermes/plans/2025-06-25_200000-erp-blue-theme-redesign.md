# ERP 商务蓝主题改造方案

> 参考「易特ERP标准版」截图，将新系统改造为传统商务蓝风格。

**目标：** 在保持现有 React+AntD+侧边栏架构不变的前提下，将配色和销售订单页面改造为截图风格。

**设计读：** 传统桌面 ERP 商务蓝风格，面向纸箱厂一线操作人员，以蓝/白/绿/红四色体系为主，注重信息密度和操作效率。

**架构：** 仅改前端 CSS/组件层，不动后端 API 和路由结构。

---

## 色值参考（从截图提取）

| 用途 | 色值 | 说明 |
|------|------|------|
| 主色（深蓝） | `#1e40af` | 侧边栏/标题栏背景 |
| 主色浅 | `#2563eb` | 选中态/按钮主色 |
| 表头蓝 | `#dbeafe` | 表格表头背景 |
| 字段绿 | `#e8f5e9` / `#16a34a` | 日期/标题强调 |
| 金额红 | `#dc2626` | 合计金额/应收 |
| 背景白 | `#f8fafc` | 内容区背景 |
| 卡片白 | `#ffffff` | 卡片/表格背景 |
| 边框灰 | `#e2e8f0` | 分割线 |

---

## 阶段 1：全局配色改造（Layout.tsx）

### Task 1.1：替换侧边栏颜色常量

**文件：** `apps/web/src/components/Layout.tsx:33-38`

将深色侧边栏配色改为商务蓝：

```tsx
// 旧
const BRAND = '#2c5282';
const SIDER_BG = '#1e293b';
const SIDER_HOVER = '#334155';
const SIDER_ACTIVE = '#0f172a';

// 新
const BRAND = '#1e40af';
const SIDER_BG = '#1e3a8a';       // 深蓝底色
const SIDER_HOVER = '#1d4ed8';    // 悬停亮蓝
const SIDER_ACTIVE = '#1e40af';   // 选中态
const AMBER = '#dc2626';          // 改为红色，用于金额强调
```

### Task 1.2：修改 Ant Design ConfigProvider 全局主题

**文件：** 新建 `apps/web/src/theme.ts`

```tsx
// 通过 AntD ConfigProvider 注入全局组件样式
export const themeConfig = {
  token: {
    colorPrimary: '#1e40af',
    colorSuccess: '#16a34a',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    borderRadius: 4,                    // 小圆角，传统风格
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f1f5f9',
    fontFamily: `'Microsoft YaHei', 'PingFang SC', sans-serif`,
  },
  components: {
    Table: {
      headerBg: '#dbeafe',              // 浅蓝表头
      headerColor: '#1e3a8a',
      rowHoverBg: '#eff6ff',
      borderColor: '#bfdbfe',
    },
    Card: {
      headerBg: '#eff6ff',
    },
    Button: {
      primaryShadow: 'none',            // 去掉阴影，传统风格
    },
    Tag: {
      defaultBg: '#f1f5f9',
    },
  },
};
```

### Task 1.3：在 main.tsx 或 App.tsx 中包裹 ConfigProvider

**文件：** `apps/web/src/App.tsx`

在 `<BrowserRouter>` 外侧包裹 `<ConfigProvider theme={themeConfig}>`。

---

## 阶段 2：销售订单页面改造（Orders.tsx）

### Task 2.1：添加页面级标题栏

在当前 Orders 页面顶部添加大标题区，仿截图样式：

```tsx
// 页面顶部标题区
<div style={{
  background: '#e8f5e9',
  padding: '12px 20px',
  borderRadius: 4,
  marginBottom: 16,
  display: 'flex',
  alignItems: 'center',
  gap: 16,
}}>
  <span style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>销售订单</span>
  <Tag color="blue">待审核</Tag>
  <span style={{ marginLeft: 'auto', color: '#64748b' }}>
    共 {kpi.total} 单 | 待确认 {kpi.pending} | 生产中 {kpi.producing}
  </span>
</div>
```

### Task 2.2：改造 KPI 统计区

将当前统计改为紧凑的横向指标条（仿截图顶部信息行）：

```tsx
<div style={{
  display: 'flex', gap: 24, padding: '8px 16px',
  background: '#ffffff', border: '1px solid #e2e8f0',
  borderRadius: 4, marginBottom: 16, flexWrap: 'wrap',
}}>
  <span>总订单：<b style={{ color: '#1e40af' }}>{kpi.total}</b></span>
  <span>待确认：<b style={{ color: '#d97706' }}>{kpi.pending}</b></span>
  <span>生产中：<b style={{ color: '#2563eb' }}>{kpi.producing}</b></span>
  <span>待发货：<b style={{ color: '#7c3aed' }}>{kpi.shipping}</b></span>
  <span style={{ marginLeft: 'auto' }}>
    有效金额：<b style={{ color: '#dc2626', fontSize: 16 }}>
      ¥{kpi.totalAmount.toLocaleString()}
    </b>
  </span>
</div>
```

### Task 2.3：新增/编辑弹窗改造为全宽表单

将 Modal 中的表单改为截图风格的表单布局：

- 第一行：订单日期 | 交货日期 | 自定义单号（3 列）
- 第二行：客户 | 联系人 | 手机（3 列）
- 第三行：经手人 | 收款账户 | 交易类型（3 列）
- 中间：产品查询搜索栏 + 明细表格（浅蓝表头）
- 底部：合计金额（红色）+ 应收 + 制单人

### Task 2.4：明细表格表头样式

所有表格使用浅蓝表头、紧凑行距：

```tsx
<Table
  size="small"
  bordered
  pagination={{ pageSize: 20, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
  style={{ background: '#ffffff' }}
  // columns 中金额列使用红色字体
/>
```

金额列渲染示例：
```tsx
{
  title: '金额',
  dataIndex: 'total_amount',
  render: (v: number) => (
    <span style={{ color: '#dc2626', fontWeight: 600 }}>
      ¥{Number(v || 0).toFixed(2)}
    </span>
  ),
}
```

---

## 阶段 3：其他关键页面配色同步

### Task 3.1：采购单 (Purchases.tsx)
- 标题改为绿色大标题「采购单」
- 金额列红色
- 表格表头浅蓝

### Task 3.2：送货单 (Deliveries.tsx)
- 同理应用绿色标题 + 金额红色

### Task 3.3：仪表盘 (Dashboard.tsx)
- KPI 卡片保持，但配色改为商务蓝
- 图表保持但颜色适配新主题

---

## 阶段 4：构建与验证

### Task 4.1：构建前端
```bash
cd /home/ubuntu/data/erp-new/apps/web && npx vite build
```

### Task 4.2：重启服务
```bash
pm2 restart paperbox-server
```

### Task 4.3：验证清单
- [ ] 访问 `http://42.193.149.154:3005/`，确认页面正常加载
- [ ] 侧边栏显示为深蓝色（非原来的深灰）
- [ ] 进入销售订单页，标题为绿色大标题
- [ ] 表格表头为浅蓝色
- [ ] 金额列为红色粗体
- [ ] 采购单页面风格一致
- [ ] 所有页面无报错

---

## 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 修改 | `apps/web/src/components/Layout.tsx` | 颜色常量 + 菜单背景色 |
| 新建 | `apps/web/src/theme.ts` | AntD 全局主题配置 |
| 修改 | `apps/web/src/App.tsx` | 包裹 ConfigProvider |
| 修改 | `apps/web/src/pages/Orders.tsx` | 标题栏 + KPI 区 + 表格 + 弹窗 |
| 修改 | `apps/web/src/pages/Purchases.tsx` | 配色同步 |
| 修改 | `apps/web/src/pages/Deliveries.tsx` | 配色同步 |
| 修改 | `apps/web/src/pages/Dashboard.tsx` | KPI 卡片配色 |

---

## 风险 & 注意事项

1. **AntD 版本兼容** — ConfigProvider 的 `theme.token` 需要 AntD >= 5.0（当前项目已使用 antd 5.x，确认兼容）
2. **表格列太多** — 截图风格表格较宽，可能需要横向滚动，`scroll={{ x: 1200 }}` 已就位
3. **颜色对比度** — 浅蓝表头 + 深蓝文字，WCAG AA 级别可过
4. **移动端** — 侧边栏 + 表格在移动端会受影响，但目标用户是桌面端操作
5. **金额红色** — 仅对正数金额着色，负数/0 保持灰色

---

## 预估工时

- 阶段 1（配色）：30 分钟
- 阶段 2（销售订单）：1.5 小时
- 阶段 3（其他页面）：1 小时
- 阶段 4（构建验证）：15 分钟
- **总计：约 3 小时**
