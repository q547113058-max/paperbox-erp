#!/bin/bash
# 查看 Paperbox ERP 状态
cd "$(dirname "$0")/.."
echo "==> PM2 状态"
pm2 status
echo ""
echo "==> 端口监听"
ss -tlnp 2>/dev/null | grep -E ":3003|:4173" || echo "无监听"
echo ""
echo "==> 健康检查"
TOKEN=$(curl -s http://localhost:3003/api/auth/login -X POST -H 'Content-Type: application/json' -d '{"username":"boss","password":"demo"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null)
if [ -n "$TOKEN" ]; then
  echo "  ✅ API 登录成功，token len: ${#TOKEN}"
  echo "  /api/products: $(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3003/api/products | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")  条"
else
  echo "  ❌ API 登录失败"
fi
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/ 2>/dev/null || echo "000")
echo "  / (web):  HTTP $WEB_STATUS"
