# 纸箱 ERP v2

开平市丰晟达食品有限公司 — 纸箱/鸡爪供应链 ERP 系统。

NestJS + React + Ant Design + TypeScript + SQLite monorepo。

## 环境

| 环境 | IP | 入口 | 文档 |
|------|-----|------|------|
| 测试服 | 193.112.246.85:3003 | nginx -> NestJS :3005 | docs/deployment.md |
| 正式服 | 42.193.149.154:3005 | NestJS express.static | docs/deployment-production.md |

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | NestJS 10 + TypeORM + better-sqlite3 |
| 前端 | React 18 + Ant Design 5 + Vite |
| 数据库 | SQLite 3 (WAL mode) |
| 语言 | TypeScript 5 |
| 认证 | JWT (passport) |

## 快速开始

```bash
# 安装
npm install --workspaces

# 启动后端 (热重载)
cd apps/server && npx ts-node-dev --transpile-only --respawn src/main.ts

# 启动前端 dev
cd apps/web && npx vite --host 0.0.0.0 --port 5174

# 构建前端
cd apps/web && npx vite build
```

## 登录

| 用户名 | 密码 | 角色 |
|--------|------|------|
| boss | demo | 管理员 |
| demo | demo | 仓库 |

## 部署

- **测试服**: nginx 反向代理，见 docs/deployment.md
- **正式服**: NestJS express.static 直出，见 docs/deployment-production.md

### 部署流程概要

```
测试服开发 -> git commit [sync] -> GitHub -> 正式服 git pull -> vite build -> 验证
```

## 项目文档

| 文档 | 说明 |
|------|------|
| AGENTS.md | Agent 开发手册 (环境/端口/踩坑/门禁) |
| docs/architecture.md | 系统架构总览 |
| docs/deployment.md | 测试服部署指南 |
| docs/deployment-production.md | 正式服部署指南 |
| docs/design-tokens.md | 设计规范 |
| docs/project-requirements.md | 需求文档 |
| docs/refactor-findings-*.md | 重构发现记录 |
| dev-logs/ | 每日开发日志 |

## 质量门禁

```bash
npm run typecheck && npm test && npm run lint && npm run build && bash scripts/smoke.sh
```

## 目录结构

```
├── apps/
│   ├── server/          # NestJS 后端 (180+ 端点)
│   └── web/             # React 前端 (16 个业务页面)
├── docs/                # 项目文档
├── dev-logs/            # 开发日志
├── scripts/             # 运维脚本
└── ecosystem.config.cjs # PM2 配置 (备用)
```

## 业务模块

产品 / 订单 / 客户 / 供应商 / 人员 / 工单 / 委外 / 仓库 / 发货 / 财务 / 对账 / 彩印 / 刀模 / 设置 / 操作日志 / 全局搜索
