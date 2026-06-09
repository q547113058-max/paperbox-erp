# 开发日志 - 2026-06-09（续）

## 会话续

- 阶段：Phase 3（PM2 部署）
- 上次完成：Phase 2 前端页面 + dw-skills 补救

## 已完成（今日续）

### Phase 3：PM2 部署

- 重写 `ecosystem.config.cjs`：
  - paperbox-server: NestJS `dist/main.js`（production）
  - paperbox-web: `npm run preview`（vite preview, port 4173）
- 修 `tsconfig.json`：`rootDir: src` + `include/exclude`
- 创建 `scripts/start.sh` — 一键部署脚本
- 创建 `scripts/stop.sh` / `scripts/restart.sh` / `scripts/status.sh`
- 创建 `docs/nginx-paperbox-erp.conf` — 三种 Nginx 反代模式
- 创建 `docs/deployment.md` — 完整部署指南
- PM2 启动成功：server (pid 680902, online) + web (pid 678488, online)

### 验证

- ✅ `http://localhost:4173/` → 200（前端）
- ✅ `http://localhost:3003/api/auth/login` → 200（API 登录）
- ✅ `pm2 status` → 2 个 app online
- ✅ `tsc --noEmit` → EXIT 0

## 遗留

- GitHub 推送完成（force-push 到 `q547113058-max/paperbox-erp` main）
- `/tmp/` 下有含 token 的临时 askpass 文件（建议清理）
- `ghp_pW...oYI6` token 建议撤销，改用 fine-grained token 或 SSH key
- ESLint 96 warnings（无 error）待逐个清理

## 下一步

- [ ] 撤销 `ghp_pW...oYI6` token，换新 token/SSH
- [ ] Nginx 部署到生产（需要域名 + HTTPS 证书）
- [ ] 增加 eslint ignore 规则减少 warnings
- [ ] 逐个测试所有 CRUD 页面（Products / Orders / Customers 弹窗保存）
