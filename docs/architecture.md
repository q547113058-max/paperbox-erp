# 纸箱 ERP 系统架构

> 2026-06-12 | 双环境架构总览

## 整体拓扑

测试服 (193.112.246.85) 和正式服 (42.193.149.154) 通过 GitHub 同步代码。
测试服使用 nginx 独立服务前端，正式服由 NestJS express.static 直出。

## 技术栈

| 层级 | 技术 |
|------|------|
| 运行时 | Node.js >= 20 |
| 后端框架 | NestJS 10.x |
| ORM | TypeORM 0.3.x |
| 数据库驱动 | better-sqlite3 11.x |
| 数据库 | SQLite 3 (WAL mode) |
| 前端框架 | React 18.x |
| UI 库 | Ant Design 5.x |
| 构建工具 | Vite 5.x |
| 语言 | TypeScript 5.x |

## 项目结构

```
paperbox-erp/
├── apps/
│   ├── server/           # NestJS 后端
│   │   └── src/
│   │       ├── main.ts           # 入口 (启动/静态文件/CORS/Swagger)
│   │       ├── app.module.ts     # 根模块 + SQLite WAL 配置
│   │       ├── entities/         # TypeORM Entity (raw FK)
│   │       ├── controllers/      # API 路由
│   │       ├── services/         # 业务逻辑
│   │       └── middleware/       # JWT 鉴权
│   └── web/              # React 前端
│       ├── src/
│       │   ├── pages/            # 16 个业务页面
│       │   ├── components/       # 共享组件
│       │   └── types/            # 类型定义
│       └── dist/                 # Vite 构建输出
├── docs/                 # 项目文档
├── dev-logs/             # 开发日志
└── package.json          # monorepo root
```

## 前端部署差异

### 测试服: nginx 独立服务

浏览器 -> nginx :3003
  /api/* -> proxy_pass -> NestJS :3005
  /*     -> /var/www/paperbox-erp/index.html

### 正式服: NestJS 内嵌静态服务

浏览器 -> NestJS :3005
  /api/* -> Controller 处理
  /*     -> express.static(apps/web/dist/)

## 端口分配

| 端口 | 测试服 | 正式服 |
|------|--------|--------|
| 3005 | NestJS API | NestJS API + 前端静态 |
| 3003 | nginx (前端入口) | — |
| 3001 | 旧 ERP Express | 旧 ERP Express |
| 80 | — | Caddy 默认页 |
| 22 | SSH | SSH |

## 数据库

- 测试服: /data/erp-data/erp-system/erp.db
- 正式服: /home/ubuntu/data/erp-system/erp.db
- 模式: SQLite WAL (journal_mode=WAL, synchronous=NORMAL, busy_timeout=5000)
- TypeORM: synchronize: false

## 业务模块

| 模块 | 前端页面 |
|------|---------|
| 认证 | Login |
| 仪表盘 | Dashboard |
| 产品 | Products (CRUD + 图片) |
| 订单 | Orders (CRUD + 状态流转) |
| 客户 | Customers (CRUD) |
| 供应商 | Suppliers (CRUD) |
| 人员 | Personnel (CRUD) |
| 工单 | WorkOrders |
| 委外 | OutsourcingOrders |
| 仓库 | Warehouse |
| 发货 | Deliveries |
| 财务 | Finance / Receivables / Payables |
| 对账 | ReconciliationBills |
| 彩印 | ColorPrints |
| 刀模 | KnifeDies |
| 设置 | Settings |
| 操作日志 | ActionLogs |
| 全局搜索 | GlobalSearch |

## 环境差异

| 项目 | 测试服 | 正式服 |
|------|--------|--------|
| IP | 193.112.246.85 | 42.193.149.154 |
| 用户 | root | ubuntu |
| 路径 | /root/workspace/paperbox-erp/ | /home/ubuntu/data/erp-new/ |
| 前端入口 | nginx :3003 | NestJS :3005 |
| 前端部署路径 | /var/www/paperbox-erp/ | apps/web/dist/ |
| 构建后操作 | bash scripts/deploy-frontend.sh | 无需 (后端自动读取) |
| 进程管理 | 手动后台 | screen 会话 |
| nginx | 已配置 | 无 |
| PM2 | 未使用 | 未使用 |
