#!/bin/bash
# 启动 Paperbox ERP (production)
# 用法：bash scripts/start.sh
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> [1/4] 检查环境..."
if ! command -v pm2 &> /dev/null; then
  echo "❌ pm2 未安装，请运行：npm install -g pm2"
  exit 1
fi
if ! command -v node &> /dev/null; then
  echo "❌ node 未安装"
  exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js >= 20 required (当前 $(node -v))"
  exit 1
fi

echo "==> [2/4] 构建后端..."
cd "$ROOT/apps/server"
if [ ! -d "node_modules" ]; then
  echo "  安装依赖..."
  cd "$ROOT" && npm install --workspaces
fi
cd "$ROOT/apps/server"
if [ ! -d "dist" ] || [ -n "$(find src -name '*.ts' -newer dist/main.js 2>/dev/null | head -1)" ]; then
  echo "  tsc 编译..."
  npm run build
fi

echo "==> [3/4] 构建前端..."
cd "$ROOT/apps/web"
if [ ! -d "dist" ] || [ -n "$(find src -name '*.tsx' -newer dist/index.html 2>/dev/null | head -1)" ]; then
  echo "  vite build..."
  npm run build
fi

echo "==> [4/4] 启动 PM2..."
cd "$ROOT"
mkdir -p logs
pm2 delete paperbox-server 2>/dev/null || true
pm2 delete paperbox-web 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 status

echo ""
echo "✅ Paperbox ERP 已启动"
echo "   API:   http://localhost:3003/api"
echo "   Web:   http://localhost:4173"
echo "   登录:  boss / demo"
echo ""
echo "常用命令："
echo "  pm2 logs                  # 看日志"
echo "  pm2 restart all           # 重启"
echo "  pm2 stop all              # 停止"
