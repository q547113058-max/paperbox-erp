# 设计 Tokens - 纸箱 ERP

> 2026-06-08 用户确认：B2B 工业风（白色背景 + AntD 默认蓝 + 思源黑体）

## 主题

```ts
// apps/web/src/main.tsx
<ConfigProvider
  locale={zhCN}
  theme={{
    token: {
      fontFamily: "'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      colorPrimary: '#1677ff',  // AntD 默认蓝
      borderRadius: 2,           // 工业风小圆角
    },
  }}
>
```

## 颜色

| 用途 | Token | 备注 |
|------|-------|------|
| 主色（按钮/链接/聚焦） | `#1677ff` | AntD 默认蓝 |
| 背景 | `#f5f5f5` | 工业风浅灰 |
| 卡片 | `#ffffff` | 纯白 |
| 文字主色 | `rgba(0,0,0,0.88)` | AntD 默认 |
| 文字次色 | `rgba(0,0,0,0.65)` | |
| 状态色 | 见下表 | |

### 订单状态色

```ts
const STATUS_COLOR = {
  '待确认': 'default',   // 灰
  '已确认': 'blue',      // 蓝
  '生产中': 'orange',    // 橙
  '待发货': 'purple',    // 紫
  '已完成': 'green',     // 绿
  '已取消': 'red',       // 红
};
```

## 字体

- 字体族：思源黑体（Noto Sans SC）
- 来源：Google Fonts CDN
- 备用栈：`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- 字号：AntD 默认（14px body, 16px h2）

## 间距 / 圆角

- 圆角：`2px`（小，工业感）
- 卡片 padding：`24px`
- 表格行高：默认 AntD
- 表单字段间距：`Space wrap`

## 加载 / 占位

- 表格 loading：AntD 内置 spinner
- 卡片 loading：`<Card loading>` 骨架屏
- 空状态：AntD `<Empty />`

## 布局

- Layout：Header (64px) + Sider (200px) + Content
- Header：白色背景 + 阴影
- Sider：深色（`#001529`）
- 菜单图标：Ant Design Icons
- 内容区背景：`#f5f5f5`

## 图标

使用 `@ant-design/icons`：
- Dashboard → `DashboardOutlined`
- Products → `AppstoreOutlined`
- Orders → `ShoppingCartOutlined`
- Purchases → `InboxOutlined`
- Warehouse → `InboxOutlined`
- Deliveries → `CarOutlined`
- Finance → `BankOutlined`
- Customers → `TeamOutlined`
- Suppliers → `TeamOutlined`
- Personnel → `SettingOutlined`

## 已实现页面

| 页面 | 路径 | 状态 |
|------|------|------|
| Login | `/login` | ✅ |
| Dashboard | `/` | ✅ |
| Products | `/products` | ✅ 完整 CRUD |
| Orders | `/orders` | ✅ 完整 CRUD |
| Customers | `/customers` | ✅ 完整 CRUD |
| Suppliers | `/suppliers` | ✅ 完整 CRUD |
| Personnel | `/personnel` | ✅ 完整 CRUD |
| Purchases | `/purchases` | ✅ 只读 |
| Warehouse | `/warehouse` | ✅ 只读 |
| Deliveries | `/deliveries` | ✅ 只读 |
| Finance | `/finance` | ✅ 只读 |
