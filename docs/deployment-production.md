# 纸箱 ERP 正式服部署指南

> 2026-06-12 | ubuntu@42.193.149.154:/home/ubuntu/data/erp-new/

## 环境信息

| 项目 | 值 |
|------|-----|
| 服务器 | 42.193.149.154 |
| 用户 | ubuntu |
| 项目路径 | /home/ubuntu/data/erp-new/ |
| 数据库 | /home/ubuntu/data/erp-new/erp.db |
| 后端端口 | 3005 |
| 前端入口 | http://42.193.149.154:3005/ |

## 架构

正式服不使用 nginx。NestJS 通过 express.static 直接服务前端：

```
浏览器 -> :3005 -> NestJS
  /api/* -> Controller
  /*     -> express.static(apps/web/dist/) -> SPA fallback
```

## 初始部署

```bash
# 1. Clone
cd /home/ubuntu/data
git clone https://github.com/q547113058-max/paperbox-erp.git erp-new

# 2. 安装
cd /home/ubuntu/data/erp-new
npm install --workspaces

# 3. native binding
npm rebuild better-sqlite3 --build-from-source

# 4. 构建前端
cd apps/web && npx vite build

# 5. 启动
cd /home/ubuntu/data/erp-new/apps/server
npx ts-node-dev --transpile-only --respawn src/main.ts
```

## 更新流程

### 方式 A: GitHub 同步（推荐）

```bash
# 测试服: commit + push
cd /root/workspace/paperbox-erp
git add <files> && git commit -m "[sync] 描述"

# 正式服: pull + build
cd /home/ubuntu/data/erp-new
git pull origin main
cd apps/web && npx vite build
# ts-node-dev 自动检测 .ts 变更 respawn
```

### 方式 B: rsync 直传

```bash
# 在测试服执行
rsync -avz --exclude 'node_modules' --exclude '.git'   /root/workspace/paperbox-erp/   ubuntu@42.193.149.154:/home/ubuntu/data/erp-new/

rsync -avz   /root/workspace/paperbox-erp/apps/web/dist/   ubuntu@42.193.149.154:/home/ubuntu/data/erp-new/apps/web/dist/

# 重启后端
ssh ubuntu@42.193.149.154   'pkill -f "ts-node-dev.*erp-new" &&    cd /home/ubuntu/data/erp-new/apps/server &&    nohup npx ts-node-dev --transpile-only --respawn src/main.ts > /dev/null 2>&1 &'
```

## 验证

```bash
# API 正常
curl -s http://localhost:3005/api/products?limit=1
# 应返回 JSON (401 = 鉴权正常)

# 登录
curl -s http://localhost:3005/api/auth/login -X POST   -H 'Content-Type: application/json'   -d '{"username":"boss","password":"demo"}'

# 前端
curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/
# 应返回 200

# JS 文件可达
JSFILE=$(grep -o 'index-[^.]*\.js' apps/web/dist/index.html | head -1)
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3005/assets/$JSFILE"
# 应返回 200
```

## 故障排查

### 前端空白/404

```bash
# dist 是否存在
ls apps/web/dist/index.html || (cd apps/web && npx vite build)
```

### JS hash 不匹配

```bash
# 清除重新构建
cd apps/web && rm -rf dist && npx vite build
```

### 后端 404

```bash
# 401 = 路由存在, 404 = 路由不存在
curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/api/products

# 检查 ts-node-dev 进程龄
ps -p $(pgrep -f "ts-node-dev.*erp-new") -o pid,etime,cmd
# 如果 > 30min 且刚改过代码 -> kill 重启
```

### 数据库 WAL

```bash
sqlite3 /home/ubuntu/data/erp-new/erp.db "PRAGMA journal_mode;"
# 应返回 wal
sqlite3 /home/ubuntu/data/erp-new/erp.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

## 进程管理

当前用 screen 会话:

```bash
screen -S erp-server
cd /home/ubuntu/data/erp-new/apps/server
npx ts-node-dev --transpile-only --respawn src/main.ts

# 查看: screen -ls
# 重连: screen -r erp-server
```

如需 PM2:

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save && pm2 startup
```

## 日志

- 应用输出: screen 会话 (screen -r erp-server)
- 开发日志: /home/ubuntu/data/erp-new/dev-logs/
