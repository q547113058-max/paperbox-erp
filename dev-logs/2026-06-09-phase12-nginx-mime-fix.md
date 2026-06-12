# Dev Log — 2026-06-09 (Phase 12: Nginx MIME type 修复)

## 摘要

修复前端 MIME type 错误：CSS/JS 文件被 Vite preview SPA fallback 返回 text/html。

## 根因

1. Vite preview server 对所有请求做 SPA fallback（返回 index.html）
2. 浏览器缓存旧的 JS/CSS 文件名（带旧 hash）
3. 重建后旧文件名不存在 → Vite 返回 index.html（text/html）
4. 浏览器报 MIME type 错误 + "Cannot use import statement outside a module"

## 修复

1. **nginx 配置**：静态资源直接从 `/var/www/paperbox-erp/assets/` 服务，不经过 Vite preview
2. **权限问题**：nginx worker (www-data) 无权访问 `/root/`，所以 dist 复制到 `/var/www/`
3. **部署脚本**：`scripts/deploy-frontend.sh` 自动 build + copy + reload nginx

## 验证

```
existing CSS: 200 text/css ✓
existing JS:  200 application/javascript ✓
missing CSS:  404 (不再返回 text/html) ✓
SPA /login:   200 text/html ✓
API login:    200 ✓
```

## 修改文件

| 文件 | 改动 |
|------|------|
| docs/nginx-paperbox-erp.conf | 静态资源从 /var/www/ 直接服务，不存在文件返回 404 |
| scripts/deploy-frontend.sh | 新建：build + copy + reload nginx 一键部署 |

## 后续 5 档投票

| 档位 | 建议 |
|------|------|
| **A** | **部署正式服 — 推荐** |
| B | 暂停等反馈 |
| C | 其他（用户指定） |