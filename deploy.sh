#!/bin/bash
# Paperbox ERP 一键部署脚本
# 用法: bash deploy.sh

set -e
echo "=== Paperbox ERP 部署 ==="

# 1. 安装依赖
echo "[1/3] 安装依赖..."
npm install --legacy-peer-deps

# 2. 构建前端
echo "[2/3] 构建前端..."
cd apps/web && npx vite build && cd ../..

# 3. 启动后端
echo "[3/3] 启动后端 (端口 3005)..."
cd apps/server && npx ts-node-dev --transpile-only src/main.ts &
sleep 6

# 验证
FRONTEND=$(curl -s --noproxy '*' -o /dev/null -w "%{http_code}" http://localhost:3005/)
API=$(curl -s --noproxy '*' -o /dev/null -w "%{http_code}" http://localhost:3005/api/products)
echo ""
echo "前端: HTTP $FRONTEND | API: HTTP $API"
echo "访问: http://$(hostname -I | awk '{print $1}'):3005/"
echo "登录: admin / admin123"
