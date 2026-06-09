#!/bin/bash
# 重启 Paperbox ERP
set -e
cd "$(dirname "$0")/.."
pm2 restart paperbox-server paperbox-web 2>/dev/null || pm2 start ecosystem.config.cjs
echo "✅ 已重启"
pm2 status
