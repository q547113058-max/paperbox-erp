# 纸箱 ERP 重构项目 - AGENTS.md

> 本文件是本项目子目录的 Agent 入口，**补充** `~/.hermes/skills/dw-skills-main/AGENTS.md` 的全局规则。
> 必读：dw-skills 阶段 0 → 1 → 2 → 3 → 4 → 5 → 6。

## 项目路径

- 仓库根：`/root/workspace/paperbox-erp/`
- 后端：`apps/server/`（NestJS + TypeORM + better-sqlite3）
- 前端：`apps/web/`（Vite + React + AntD + Noto Sans SC）
- 数据库：`/data/erp-data/erp-system/erp.db`（`synchronize: false`，不迁移）
- 计划：`/root/.hermes/plans/paperbox-erp-refactor.md`
- 日志：`dev-logs/YYYY-MM-DD.md`
- 文档：`docs/`

## 必读文件（启动检查清单）

1. `dev-logs/YYYY-MM-DD.md` — 当天记录
2. `/root/.hermes/plans/paperbox-erp-refactor.md` — 总计划
3. `docs/project-requirements.md` — 已确认需求
4. `docs/design-tokens.md` — 主题/颜色/字体配置
5. `git status && git branch --show-current && git log -5 --oneline` — 当前状态

## 端口分配（重要）

| 服务 | 端口 | 进程 |
|------|------|------|
| NestJS 后端 | **3005** | `node -r ts-node/register src/main.ts` |
| Vite 前端 dev | **5174** | `npx vite` |
| 旧纸箱 Express | ~~3001~~ | PM2 `paperbox-erp`（不冲突，但不要误杀） |
| 鸡爪 ERP | 3001 / 5173 | 独立项目（不混淆） |

## 反复踩过的坑（必须预防）

### 坑 #1: 端口 3003 被旧 Express 进程抢占
- **触发**：`curl http://localhost:3003/api/...` 返回 401 / 500 且 `X-Powered-By: Express`
- **必须行为**：`ss -tlnp | grep 3003` 确认 pid 后 `kill <pid>` 旧 Express
- **禁止**：看到 401 就以为是 JWT 问题，先检查 `X-Powered-By` header

### 坑 #2: TypeORM Entity 缺少 @ManyToOne 关系
- **触发**：在 service 中使用 `relations: ['xxx']` 但 Entity 没声明该关系
- **症状**：`EntityPropertyNotFoundError: Property "xxx" was not found in "Xxx"`
- **必须行为**：Entity 全部使用 raw foreign key（`customer_id: number`），service 不写 `relations`
- **禁止**：使用 `relations: [...]` 除非 Entity 真的有 @ManyToOne / @OneToMany 装饰器

### 坑 #3: better-sqlite3 native binding 路径
- **触发**：`Error: Could not locate the bindings file ... better_sqlite3.node`
- **必须行为**：
  ```bash
  # 1. 重建
  npm rebuild better-sqlite3 --build-from-source
  # 2. 同时复制到全局（cronjob / 新 Node 进程能加载）
  mkdir -p /root/node_modules/better-sqlite3/lib/binding/node-v127-linux-x64
  cp node_modules/better-sqlite3/build/Release/better_sqlite3.node \
     /root/node_modules/better-sqlite3/lib/binding/node-v127-linux-x64/
  # 3. 或者改用 symlink
  mkdir -p node_modules/better-sqlite3/lib/binding/node-v127-linux-x64
  ln -sf ../../build/Release/better_sqlite3.node \
         node_modules/better-sqlite3/lib/binding/node-v127-linux-x64/
  ```
- **禁止**：假设 `npm install` 后 native binding 就绪

### 坑 #4: accounts 表可能是空的
- **触发**：JWT 登录返回 "用户名或密码错误"
- **必须行为**：
  ```sql
  SELECT COUNT(*) FROM accounts;
  -- 如果 0，注入测试账号：
  -- username: 'boss' / password: 'demo' (bcrypt hash)
  -- username: 'demo' / password: 'demo' (bcrypt hash)
  ```

### 坑 #6: SQLite 数据不持久化（重启后丢失）
- **触发**：编辑/创建数据后重启 server，数据被还原
- **症状**：`erp.db` 修改时间不变，`erp.db-wal` 有更新但未 checkpoint
- **必须行为**：在 AppModule 中配置 SQLite pragma
  ```typescript
  // app.module.ts - OnModuleInit
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('busy_timeout = 5000');
  db.close();
  ```
- **禁止**：依赖 TypeORM 默认配置（不启用 WAL）

### 坑 #5: 前端 API 路径前缀
- **触发**：前端 `/api/auth/login` 404
- **必须行为**：`main.ts` 中 `app.setGlobalPrefix('api')`（已就位）
- **vite.config.ts**：`proxy: { '/api': { target: 'http://localhost:3003' } }`

## 常用命令

```bash
# 启动后端
cd /root/workspace/paperbox-erp/apps/server && \
  node -r ts-node/register src/main.ts &

# 启动前端 dev
cd /root/workspace/paperbox-erp/apps/web && npx vite --host 0.0.0.0 --port 5174 &

# TypeScript 编译检查
npx tsc --noEmit -p apps/server/tsconfig.json

# 前端构建
cd apps/web && npx vite build

# 登录
curl -s http://localhost:3003/api/auth/login -X POST \
  -H 'Content-Type: application/json' \
  -d '{"username":"boss","password":"demo"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])"

# 健康检查
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3003/api/products
```

## 质量门禁（交付前必跑）

按 dw-skills 09 文档：
1. ✅ `tsc --noEmit` — 类型检查
2. ✅ `vite build` — 前端构建
3. ⚠️ ESLint — 待加（见 dev-logs TODO）
4. ⚠️ 单元测试 — 待加（见 dev-logs TODO）
5. ⚠️ Pre-commit hook — 待加

## 当前会话质量等级

最近一次完成（2026-06-09）：**B+**
- 已做：脚手架 / TypeORM entities / JWT 鉴权 / CRUD 模块 / 前端 11 页面 / 端到端验证
- 未做：ESLint / 单元测试 / design tokens 文档 / 严格 TDD
