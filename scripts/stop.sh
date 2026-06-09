#!/bin/bash
# 停止 Paperbox ERP
set -e
cd "$(dirname "$0")/.."
pm2 stop paperbox-server paperbox-web 2>/dev/null || true
echo "✅ 已停止"
pm2 status
