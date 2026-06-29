# 纸箱 ERP 重构项目 — AGENTS.md

> 本文件是该项目的 Agent 入口, 补充 ~/.hermes/skills/dw-skills-main/AGENTS.md 的全局规则.
> 必读: dw-skills 阶段 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6.

## 环境速查

| 环境 | IP | 用户 | 路径 | 后端端口 | 前端入口 |
|------|-----|------|------|----------|----------|
| 测试服 | 193.112.246.85 | root | /root/workspace/paperbox-erp/ | 3005 | nginx :3003 -> /var/www/paperbox-erp/ |
| 正式服 | 42.193.149.154 | ubuntu | /home/ubuntu/data/erp-new/ | 3005 | NestJS express.static :3005 |

## 目录结构

```
/home/ubuntu/data/erp-new/
├── AGENTS.md                   # 本文件
├── apps/
│   ├── server/                 # NestJS + TypeORM + better-sqlite3
│   │   └── src/
│   │       ├── main.ts         # 入口 (含 express.static 服务前端)
│   │       ├── app.module.ts   # 模块注册 + SQLite WAL 配置
│   │       ├── entities/       # TypeORM Entity (raw FK, 无 @ManyToOne)
│   │       ├── services/       # 业务逻辑
│   │       └── controllers/    # API 路由
│   └── web/                    # Vite + React + AntD
│       └── src/
│           ├── pages/          # 16 个业务页面
│           ├── components/     # 共享组件
│           └── types/          # TypeScript 类型定义
├── docs/                       # 项目文档
├── dev-logs/                   # 每日开发日志
├── scripts/                    # 运维脚本
└── ecosystem.config.cjs        # PM2 配置 (备用)

## 端口分配

| 服务 | 测试服 | 正式服 |
|------|--------|--------|
| NestJS 后端 | 3005 | 3005 |
| 前端入口 | nginx :3003 | NestJS :3005 (express.static) |
| 旧 ERP (Express) | 3001 | 3001 |

## 数据库

- 路径: /home/ubuntu/data/erp-new/erp.db
- 模式: SQLite WAL (journal_mode=WAL, synchronous=NORMAL, busy_timeout=5000)
- TypeORM: synchronize: false
- 账号: boss/demo 和 demo/demo

## 启动/停止

```bash
# 正式服 (screen 会话中)
screen -r erp-server
# 或重新启动:
cd /home/ubuntu/data/erp-new/apps/server
npx ts-node-dev --transpile-only --respawn src/main.ts

# 测试服
cd /root/workspace/paperbox-erp/apps/server
npx ts-node-dev --transpile-only --respawn src/main.ts
```

## 构建前端

```bash
# 正式服: 构建到 apps/web/dist/, NestJS express.static 直接服务
cd /home/ubuntu/data/erp-new/apps/web && npx vite build

# 测试服: 构建后部署到 nginx 目录
cd /root/workspace/paperbox-erp/apps/web && npx vite build
bash /root/workspace/paperbox-erp/scripts/deploy-frontend.sh
```

## 同步流程 (测试服 -> 正式服)

```bash
# 1. 测试服提交
cd /root/workspace/paperbox-erp
git add <files> && git commit -m "[sync] 描述"

# 2. 正式服拉取
ssh ubuntu@42.193.149.154 'cd /home/ubuntu/data/erp-new && git pull'

# 3. 正式服构建前端
ssh ubuntu@42.193.149.154 'cd /home/ubuntu/data/erp-new/apps/web && npx vite build'

# 4. 验证
curl -s -o /dev/null -w "%{http_code}" http://42.193.149.154:3005/
```

## 反复踩过的坑

### 1: 前端未构建 -> 空白页
- 症状: :3005 返回 404 或无前端页面
- 修复: cd apps/web && npx vite build

### 2: index.html 与 JS hash 不匹配
- 症状: Expected JavaScript module but got text/html
- 修复: 整个 dist/ 目录一次性构建, 不要分开复制文件

### 3: SQLite WAL 未启用
- 症状: 编辑数据后重启丢失
- 修复: AppModule.onModuleInit 中已配置 pragma

### 4: better-sqlite3 native binding
- 症状: Could not locate the bindings file
- 修复: npm rebuild better-sqlite3 --build-from-source

### 5: accounts 表为空
- 症状: 登录返回用户名或密码错误
- 修复: seed boss/demo 账号

### 6: API 路径下划线 vs 连字符
- 症状: /api/color-prints 404, 后端注册的是 color_prints
- 修复: 前端路径必须与 @Controller 装饰器完全一致

### 7: Controller 文件存在但未注册到 AppModule
- 症状: @Controller 正确但仍 404
- 修复: 检查 app.module.ts imports 数组

## 质量门禁

```bash
# 测试服 (完整):
cd /root/workspace/paperbox-erp
npm run typecheck && npm test && npm run lint && npm run build

# 正式服 (基础):
cd /home/ubuntu/data/erp-new
curl -s http://localhost:3005/api/products?limit=1   # API
curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/   # 前端
```
