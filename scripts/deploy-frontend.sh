#!/bin/bash
# 纸箱 ERP 前端部署脚本
# 用法: bash scripts/deploy-frontend.sh
set -e

ROOT="/root/workspace/paperbox-erp"
DIST_DIR="$ROOT/apps/web/dist"
SERVE_DIR="/var/www/paperbox-erp"

echo "🔨 Building frontend..."
cd "$ROOT/apps/web"
npx vite build

echo "📦 Copying dist to $SERVE_DIR..."
mkdir -p "$SERVE_DIR"
rm -rf "$SERVE_DIR"/*
cp -r "$DIST_DIR"/* "$SERVE_DIR/"

echo "🔄 Reloading nginx..."
nginx -t && systemctl reload nginx

echo "✅ Frontend deployed!"
echo "   Static assets: $SERVE_DIR/assets/"
echo "   Access: http://localhost:3003/"
