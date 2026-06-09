#!/bin/bash
# 纸箱 ERP 端到端冒烟测试
# 用法：bash scripts/smoke.sh

set -e

BASE_URL="http://localhost:3003"
API_URL="$BASE_URL/api"
TOKEN=""

echo "=========================================="
echo "  纸箱 ERP 端到端冒烟测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

pass() { echo -e "${GREEN}✅ $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# 1. 前端首页
echo "=== 1. 前端首页 ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$HTTP_CODE" = "200" ]; then
  pass "前端首页 HTTP $HTTP_CODE"
else
  fail "前端首页 HTTP $HTTP_CODE"
fi

# 2. 登录
echo ""
echo "=== 2. 登录测试 ==="
LOGIN_RESP=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"boss","password":"demo"}')

if echo "$LOGIN_RESP" | grep -q "access_token"; then
  TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
  pass "登录成功，获取 token"
else
  fail "登录失败: $LOGIN_RESP"
fi

# 3. 无 token 访问受保护路由
echo ""
echo "=== 3. 认证测试 ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/products")
if [ "$HTTP_CODE" = "401" ]; then
  pass "无 token 访问返回 401"
else
  fail "无 token 访问返回 $HTTP_CODE（期望 401）"
fi

# 4. 带 token 访问各 API
echo ""
echo "=== 4. API 访问测试 ==="
ENDPOINTS=("products" "orders" "customers" "suppliers" "personnel" "purchases" "warehouse_entries" "deliveries" "finance_records")

for endpoint in "${ENDPOINTS[@]}"; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$API_URL/$endpoint")
  if [ "$HTTP_CODE" = "200" ]; then
    pass "$endpoint HTTP $HTTP_CODE"
  else
    fail "$endpoint HTTP $HTTP_CODE"
  fi
done

# 5. Swagger 文档
echo ""
echo "=== 5. Swagger 文档 ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/docs")
if [ "$HTTP_CODE" = "200" ]; then
  pass "Swagger 文档 HTTP $HTTP_CODE"
else
  fail "Swagger 文档 HTTP $HTTP_CODE"
fi

# 6. 静态资源
echo ""
echo "=== 6. 静态资源测试 ==="
# 获取前端 HTML 中的 JS/CSS 资源
HTML=$(curl -s "$BASE_URL/")
if echo "$HTML" | grep -qi "<!doctype html>"; then
  pass "前端 HTML 正确返回"
else
  fail "前端 HTML 返回异常"
fi

# 7. 404 测试
echo ""
echo "=== 7. 404 测试 ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/nonexistent")
if [ "$HTTP_CODE" = "404" ]; then
  pass "不存在的路由返回 404"
else
  fail "不存在的路由返回 $HTTP_CODE（期望 404）"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}  所有冒烟测试通过！${NC}"
echo "=========================================="
