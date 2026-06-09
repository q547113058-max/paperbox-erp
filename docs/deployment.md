# 纸箱 ERP v2 - 部署指南

> 2026-06-09 | 基于 PM2 的生产部署方案

## 架构

```
[用户浏览器]
      ↓
[Nginx :80/443]   (反代 + HTTPS 终结 + SPA fallback)
      ↓
┌───────────────────────────────┐
│  paperbox-web  :4173          │  Vite preview (dist/)
│  paperbox-server :3003        │  NestJS API
└───────────────────────────────┘
      ↓
[SQLite: /data/erp-data/erp-system/erp.db]
```

## 前置条件

- Node.js >= 20
- PM2: `npm install -g pm2`
- Nginx: `sudo apt install nginx`（可选，用于生产环境 80/443）

## 一键部署

```bash
cd /root/workspace/paperbox-erp
bash scripts/start.sh
```

脚本会：
1. 检查 Node/PM2 环境
2. `tsc` 编译后端（如果 src/ 比 dist/ 新）
3. `vite build` 前端（如果 src/ 比 dist/ 新）
4. `pm2 start` 两个进程
5. `pm2 save` 开机自启

## 常用命令

```bash
# 看状态
pm2 status

# 看日志
pm2 logs paperbox-server
pm2 logs paperbox-web

# 重启（代码更新后）
bash scripts/restart.sh

# 停止
bash scripts/stop.sh

# 健康检查
bash scripts/status.sh

# 手动登录测试
curl -s http://localhost:3003/api/auth/login -X POST \
  -H 'Content-Type: application/json' \
  -d '{"username":"boss","password":"demo"}' | jq .
```

## 端口分配

| 服务 | 端口 | 进程 | 用途 |
|------|------|------|------|
| paperbox-server | 3003 | NestJS | API + Swagger |
| paperbox-web | 4173 | Vite preview | 前端静态文件 |
| Nginx | 80 | 反代 | 统一入口 |

## 日志

- PM2 日志：`/root/.pm2/logs/`
- 应用日志：`/root/workspace/paperbox-erp/logs/`
  - `server-out.log` / `server-error.log`
  - `web-out.log` / `web-error.log`

## Nginx 配置

详见 `docs/nginx-paperbox-erp.conf`，三种模式：
1. **统一入口**（推荐）：Nginx 反代 server + vite preview
2. **HTTPS**：Let's Encrypt 证书
3. **直接静态文件**：Nginx 直读 dist/（不跑 vite preview）

```bash
# 安装 nginx 配置
sudo cp docs/nginx-paperbox-erp.conf /etc/nginx/sites-available/paperbox-erp.conf
sudo ln -s /etc/nginx/sites-available/paperbox-erp.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 数据库

- 路径：`/data/erp-data/erp-system/erp.db`
- TypeORM：`synchronize: false`（不会自动建表）
- 备份：每日自动备份在 `/data/erp-data/erp-system/backups/`
- Accounts 表：`boss` / `demo` 两个测试账号（密码 `demo`）

## 升级流程

```bash
# 1. 拉代码
cd /root/workspace/paperbox-erp
git pull origin main

# 2. 安装依赖
npm install --workspaces

# 3. 构建
npm run build          # 后端
cd apps/web && npm run build  # 前端

# 4. 重启
pm2 restart all
pm2 save

# 5. 验证
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3003/api/auth/login \
  -X POST -H 'Content-Type: application/json' -d '{"username":"boss","password":"demo"}'
```

## 端到端测试

```bash
# jest e2e
cd /root/workspace/paperbox-erp
npm test

# TypeScript 编译
npm run typecheck

# ESLint
npm run lint
```

## 故障排查

### 3003 端口被占用（旧 Express 进程）
```bash
ss -tlnp | grep 3003
kill <PID>
pm2 restart paperbox-server
```

### better-sqlite3 native binding 找不到
```bash
npm rebuild better-sqlite3 --build-from-source
cp node_modules/better-sqlite3/build/Release/better_sqlite3.node \
   /root/node_modules/better-sqlite3/lib/binding/node-v127-linux-x64/
pm2 restart paperbox-server
```

### accounts 表为空（登录失败）
```python
python3 -c "
import sqlite3
db = sqlite3.connect('/data/erp-data/erp-system/erp.db')
db.execute('DELETE FROM accounts')
# 插入测试账号（密码 demo）
db.execute(\"INSERT INTO accounts (username, password, real_name, role, status) VALUES (?, ?, ?, ?, ?)\",
    ['boss', '$2b$10$U2lrloqgREEWXSwLZqJwHulKptJCDN9SxBONN/K1iBkVqiWaN/1J6', '管理员', 'boss', 'active'])
db.execute(\"INSERT INTO accounts (username, password, real_name, role, status) VALUES (?, ?, ?, ?, ?)\",
    ['demo', '$2b$10$U2lrloqgREEWXSwLZqJwHulKptJCDN9SxBONN/K1iBkVqiWaN/1J6', '演示账号', 'warehouse', 'active'])
db.commit()
print('OK: 2 accounts created')
"
```
