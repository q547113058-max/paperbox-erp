# 纸箱 ERP 测试服部署指南

> 2026-06-12 | 测试服: root@193.112.246.85 /root/workspace/paperbox-erp/

## 架构

```
浏览器 -> nginx :3003
            /api/* -> proxy_pass -> NestJS :3005
            /*     -> /var/www/paperbox-erp/index.html
```

## 部署流程

```bash
# 1. 构建前端
cd /root/workspace/paperbox-erp/apps/web && npx vite build

# 2. 部署到 nginx 目录
bash /root/workspace/paperbox-erp/scripts/deploy-frontend.sh

# 3. 后端自动热重 (ts-node-dev --respawn), 无需手动重启
```

## 验证

```bash
# nginx 正常
curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/

# API 正常
curl -s http://localhost:3005/api/products?limit=1

# 前端 JS 可达
curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/assets/
```
